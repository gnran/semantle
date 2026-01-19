"""
Semantle Game Backend
FastAPI server for semantic word guessing game
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import json
import os
from pathlib import Path
import jwt
from jwt import PyJWKClient

from game_logic import GameLogic, GameSession
from embeddings_manager import EmbeddingsManager

app = FastAPI(title="Semantle API", version="1.0.0")

# CORS middleware for React frontend
# Get allowed origins from environment variable or use defaults
origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
)
# Split, strip whitespace, and filter out empty strings
allowed_origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

# Log allowed origins for debugging (don't log in production with sensitive data)
if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY"):
    print(f"CORS: Configured {len(allowed_origins)} allowed origin(s)")
else:
    print(f"CORS: Allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize game logic and embeddings
embeddings_manager = EmbeddingsManager()
game_logic = GameLogic(embeddings_manager)

# Quick Auth configuration
QUICK_AUTH_ISSUER = "https://auth.farcaster.xyz"
QUICK_AUTH_JWKS_URL = f"{QUICK_AUTH_ISSUER}/.well-known/jwks.json"
# Get domain from environment variable, should match your mini app's deployment domain
# For production: "semantle.vercel.app" (without https://)
# For development: "localhost:3000" or your local domain
APP_DOMAIN = os.getenv("APP_DOMAIN", "semantle.vercel.app")

# Initialize JWKS client for JWT verification
try:
    jwks_client = PyJWKClient(QUICK_AUTH_JWKS_URL)
except Exception as e:
    print(f"Warning: Failed to initialize JWKS client: {e}")
    jwks_client = None

def verify_jwt_token(authorization: str = Header(None)) -> dict:
    """Verify JWT token from Quick Auth and return payload"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid Authorization header")
    
    if not jwks_client:
        raise HTTPException(status_code=500, detail="JWT verification service unavailable")
    
    token = authorization.split(" ")[1]
    
    try:
        # Get the signing key from JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify and decode the JWT
        # Note: For development, you might need to disable audience verification
        # if the token was issued for a different domain
        verify_aud = os.getenv("VERIFY_AUDIENCE", "true").lower() == "true"
        
        # Try to decode without verification first to see what's in the token
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            print(f"Token payload (unverified): {unverified_payload}")
            print(f"Expected audience: {APP_DOMAIN}, Token audience: {unverified_payload.get('aud')}")
        except Exception as e:
            print(f"Failed to decode token (unverified): {e}")
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "EdDSA"],  # Added EdDSA as it's commonly used
            issuer=QUICK_AUTH_ISSUER,
            audience=APP_DOMAIN if verify_aud else None,
            options={
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": verify_aud
            }
        )
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidAudienceError as e:
        # This is likely the issue - domain mismatch
        error_msg = f"Invalid audience. Expected: {APP_DOMAIN}, Got: {str(e)}"
        print(f"Audience error: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except jwt.InvalidIssuerError as e:
        error_msg = f"Invalid issuer. Expected: {QUICK_AUTH_ISSUER}, Got: {str(e)}"
        print(f"Issuer error: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except jwt.InvalidTokenError as e:
        error_msg = f"Invalid token: {str(e)}"
        print(f"Token validation error: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = f"Token verification failed: {str(e)}"
        print(f"Unexpected error during token verification: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# Request/Response models
class GuessRequest(BaseModel):
    word: str
    session_id: Optional[str] = None

class GuessResponse(BaseModel):
    similarity: float
    rank: int
    is_correct: bool
    session_id: str
    attempts: int

class GameSessionResponse(BaseModel):
    session_id: str
    target_word: Optional[str] = None
    attempts: List[dict]
    is_completed: bool
    daily_word: bool

class StatsResponse(BaseModel):
    total_games: int
    completed_games: int
    average_attempts: float
    best_score: int
    games_history: List[dict]

class NewGameRequest(BaseModel):
    daily: bool = False

class SaveStatsRequest(BaseModel):
    user_id: str
    session_id: str
    target_word: str
    attempts: int
    completed: bool
    daily_word: bool

@app.get("/")
async def root():
    return {"message": "Semantle API is running"}

@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "message": "Semantle API",
        "version": "1.0.0",
        "endpoints": {
            "game": {
                "new": "POST /api/game/new",
                "guess": "POST /api/game/guess",
                "session": "GET /api/game/{session_id}"
            },
            "stats": "GET /api/stats/{user_id}",
            "words": "GET /api/words/validate/{word}"
        }
    }

@app.post("/api/game/new", response_model=GameSessionResponse)
async def new_game(request: NewGameRequest = NewGameRequest(), debug: bool = False):
    """Start a new game session"""
    session = game_logic.create_new_session(daily=request.daily)
    return GameSessionResponse(
        session_id=session.session_id,
        target_word=session.target_word,  # Always reveal target word
        attempts=session.attempts,
        is_completed=session.is_completed,
        daily_word=session.daily_word
    )

@app.post("/api/game/guess", response_model=GuessResponse)
async def make_guess(request: GuessRequest):
    """Make a guess and get similarity score"""
    if not request.session_id:
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    session = game_logic.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.is_completed:
        raise HTTPException(status_code=400, detail="Game already completed")
    
    result = game_logic.make_guess(request.session_id, request.word.lower())
    
    if not result:
        raise HTTPException(status_code=400, detail="Invalid word or word not in vocabulary")
    
    return GuessResponse(
        similarity=result["similarity"],
        rank=result["rank"],
        is_correct=result["is_correct"],
        session_id=request.session_id,
        attempts=len(session.attempts)
    )

@app.get("/api/game/{session_id}", response_model=GameSessionResponse)
async def get_session(session_id: str, debug: bool = False):
    """Get game session details"""
    session = game_logic.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return GameSessionResponse(
        session_id=session.session_id,
        target_word=session.target_word,  # Always reveal target word
        attempts=session.attempts,
        is_completed=session.is_completed,
        daily_word=session.daily_word
    )

@app.get("/api/stats/{user_id}", response_model=StatsResponse)
async def get_stats(user_id: str):
    """Get user statistics"""
    stats = game_logic.get_user_stats(user_id)
    return StatsResponse(**stats)

@app.post("/api/stats/save")
async def save_stats(request: SaveStatsRequest):
    """Save game statistics for a user"""
    game_logic.save_user_game_stats(
        user_id=request.user_id,
        session_id=request.session_id,
        target_word=request.target_word,
        attempts=request.attempts,
        completed=request.completed,
        daily_word=request.daily_word
    )
    return {"message": "Stats saved successfully"}

@app.get("/api/words/validate/{word}")
async def validate_word(word: str):
    """Check if word is in vocabulary"""
    is_valid = game_logic.is_word_valid(word.lower())
    return {"valid": is_valid, "word": word}

@app.get("/api/auth")
async def authenticate_user(payload: dict = Depends(verify_jwt_token)):
    """Authenticate user using Quick Auth JWT token"""
    try:
        # Return the FID (Farcaster ID) from the token payload
        fid = payload.get("sub")
        if not fid:
            print(f"Warning: FID not found in payload. Payload: {payload}")
            raise HTTPException(status_code=400, detail="FID not found in token payload")
        
        print(f"Authentication successful for FID: {fid}")
        return {
            "fid": fid,
            "authenticated": True
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in auth endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Get port from environment variable (Railway provides PORT)
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
