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
try:
    import jwt
except ImportError:
    raise ImportError(
        "PyJWT is not installed. Please install it with: pip install PyJWT cryptography requests"
    )
import requests
from functools import lru_cache

from game_logic import GameLogic, GameSession
from embeddings_manager import EmbeddingsManager

app = FastAPI(title="Semantle API", version="1.0.0")

# Quick Auth configuration
# Reference: https://docs.base.org/mini-apps/core-concepts/authentication
QUICK_AUTH_ISSUER = "https://auth.farcaster.xyz"
QUICK_AUTH_JWKS_URL = "https://auth.farcaster.xyz/.well-known/jwks.json"

# Cache JWKS (JSON Web Key Set) for JWT verification
@lru_cache(maxsize=1)
def get_jwks():
    """Fetch and cache JWKS from Farcaster auth server"""
    try:
        response = requests.get(QUICK_AUTH_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Warning: Could not fetch JWKS: {e}")
        return None

def verify_jwt_token(token: str, domain: str) -> dict:
    """
    Verify JWT token from Quick Auth
    Returns the decoded payload if valid, raises exception otherwise
    """
    try:
        # Get JWKS
        jwks = get_jwks()
        if not jwks:
            raise ValueError("Could not fetch JWKS")
        
        # Decode token header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise ValueError("Token missing key ID")
        
        # Find the key in JWKS
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                # Convert JWK to public key
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
                key = public_key
                break
        
        if not key:
            raise ValueError("Key not found in JWKS")
        
        # Verify and decode token
        # Note: For development, we might want to be lenient with audience verification
        # In production, ensure APP_DOMAIN matches your deployment domain
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=QUICK_AUTH_ISSUER,
            audience=domain,
            options={"verify_exp": True, "verify_iss": True, "verify_aud": True}
        )
        
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")

def get_domain_from_request():
    """
    Get domain from environment variable (for JWT audience verification)
    This should match your mini app's deployment domain
    Set APP_DOMAIN environment variable to your domain (e.g., semantle.vercel.app)
    """
    domain = os.getenv("APP_DOMAIN")
    if not domain:
        # For development, try to be lenient
        # In production, APP_DOMAIN must be set
        print("Warning: APP_DOMAIN not set. JWT audience verification may fail.")
        # Return a default that might work for localhost
        domain = "localhost"
    return domain

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
async def verify_auth(authorization: Optional[str] = Header(None)):
    """
    Verify Quick Auth JWT token and return authenticated user data
    Reference: https://docs.base.org/mini-apps/core-concepts/authentication
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    domain = get_domain_from_request()
    
    try:
        # Verify JWT token
        payload = verify_jwt_token(token, domain)
        
        # Extract FID from token (sub field contains FID)
        fid = payload.get("sub")
        if not fid:
            raise HTTPException(status_code=401, detail="Token missing FID")
        
        # Get additional user info from Farcaster context if needed
        # For now, just return the FID from the token
        # You could also fetch user profile from Farcaster API here
        
        return {
            "fid": fid,
            "authenticated": True
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Get port from environment variable (Railway provides PORT)
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
