"""
Semantle Game Backend
FastAPI server for semantic word guessing game
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import json
import os
from pathlib import Path

from game_logic import GameLogic, GameSession
from embeddings_manager import EmbeddingsManager

app = FastAPI(title="Semantle API", version="1.0.0")

# CORS middleware for React frontend
# Get allowed origins from environment variable or use defaults
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
async def get_stats(user_id: str = "default"):
    """Get user statistics"""
    stats = game_logic.get_user_stats(user_id)
    return StatsResponse(**stats)

@app.get("/api/words/validate/{word}")
async def validate_word(word: str):
    """Check if word is in vocabulary"""
    is_valid = game_logic.is_word_valid(word.lower())
    return {"valid": is_valid, "word": word}

if __name__ == "__main__":
    import uvicorn
    # Get port from environment variable (Railway provides PORT)
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
