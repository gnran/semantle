"""
Game Logic for Semantle
Handles game sessions, guesses, and statistics
"""

import uuid
import json
from datetime import datetime, date
from typing import Optional, Dict, List
from pathlib import Path
import hashlib

from embeddings_manager import EmbeddingsManager

class GameSession:
    """Represents a single game session"""
    def __init__(self, session_id: str, target_word: str, daily: bool = False):
        self.session_id = session_id
        self.target_word = target_word
        self.daily_word = daily
        self.attempts: List[Dict] = []
        self.is_completed = False
        self.created_at = datetime.now().isoformat()

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "target_word": self.target_word,
            "daily_word": self.daily_word,
            "attempts": self.attempts,
            "is_completed": self.is_completed,
            "created_at": self.created_at
        }

class GameLogic:
    """Main game logic handler"""
    
    def __init__(self, embeddings_manager: EmbeddingsManager):
        self.embeddings_manager = embeddings_manager
        self.sessions: Dict[str, GameSession] = {}
        # Get paths relative to this file's location
        # Try backend directory first (for Railway deployment), then project root
        backend_dir = Path(__file__).parent
        project_root = backend_dir.parent
        self.stats_file = backend_dir / "data" / "stats.json"
        self.stats_file.parent.mkdir(parents=True, exist_ok=True)
        # Check backend directory first, then project root
        backend_words = backend_dir / "words.json"
        root_words = project_root / "words.json"
        self.words_file = backend_words if backend_words.exists() else root_words
        self.target_words = []
        self._load_words()
        self._load_daily_word()

    def _load_words(self):
        """Load words from words.json for target word selection"""
        if self.words_file.exists():
            try:
                with open(self.words_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.target_words = [word.lower().strip() for word in data.get("words", []) if word.strip()]
            except Exception as e:
                print(f"Error loading words.json: {e}")
                self.target_words = []
        else:
            print(f"Warning: words.json not found at {self.words_file}")
            self.target_words = []
    
    def _load_daily_word(self):
        """Get or generate daily word based on date"""
        if not self.target_words:
            self.daily_word = "example"  # Fallback word
            self.daily_date = date.today().isoformat()
            return
        
        today = date.today()
        date_str = today.isoformat()
        
        # Use date as seed for consistent daily word
        seed = int(hashlib.md5(date_str.encode()).hexdigest(), 16)
        
        # Select word based on seed
        daily_index = seed % len(self.target_words)
        self.daily_word = self.target_words[daily_index]
        self.daily_date = date_str

    def create_new_session(self, daily: bool = False) -> GameSession:
        """Create a new game session"""
        session_id = str(uuid.uuid4())
        
        if daily:
            target_word = self.daily_word
        else:
            # Random word from words.json
            import random
            if self.target_words:
                target_word = random.choice(self.target_words)
            else:
                target_word = "example"  # Fallback word
        
        session = GameSession(session_id, target_word, daily)
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[GameSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)

    def is_word_valid(self, word: str) -> bool:
        """Check if word is valid through OpenAI embeddings"""
        return self.embeddings_manager.is_word_valid(word)

    def make_guess(self, session_id: str, word: str) -> Optional[Dict]:
        """Make a guess and return similarity score"""
        session = self.get_session(session_id)
        if not session:
            return None
        
        if session.is_completed:
            return None
        
        word = word.lower()
        
        # Validate word
        if not self.is_word_valid(word):
            return None
        
        # Check if word was already guessed
        if any(attempt["word"] == word for attempt in session.attempts):
            return None
        
        # Calculate similarity
        similarity = self.embeddings_manager.calculate_similarity(
            word, session.target_word
        )
        
        # Calculate rank (how many words are more similar)
        rank = self.embeddings_manager.get_similarity_rank(
            word, session.target_word
        )
        
        # Check if correct
        is_correct = (word == session.target_word)
        
        # Add attempt
        attempt = {
            "word": word,
            "similarity": round(similarity, 6),
            "rank": rank,
            "is_correct": is_correct,
            "timestamp": datetime.now().isoformat()
        }
        
        session.attempts.append(attempt)
        
        if is_correct:
            session.is_completed = True
            # Stats will be saved by frontend with user_id
        
        return {
            "similarity": similarity,
            "rank": rank,
            "is_correct": is_correct
        }

    def _save_game_stats(self, session: GameSession, user_id: str = "default"):
        """Save game statistics"""
        stats = self._load_stats()
        
        if user_id not in stats:
            stats[user_id] = {
                "total_games": 0,
                "completed_games": 0,
                "total_attempts": 0,
                "games_history": []
            }
        
        stats[user_id]["total_games"] += 1
        if session.is_completed:
            stats[user_id]["completed_games"] += 1
            stats[user_id]["total_attempts"] += len(session.attempts)
        
        # Add to history
        game_record = {
            "session_id": session.session_id,
            "target_word": session.target_word,
            "attempts": len(session.attempts),
            "completed": session.is_completed,
            "daily_word": session.daily_word,
            "date": session.created_at
        }
        stats[user_id]["games_history"].append(game_record)
        
        # Keep only last 100 games
        stats[user_id]["games_history"] = stats[user_id]["games_history"][-100:]
        
        # Save to file
        with open(self.stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
    
    def save_user_game_stats(self, user_id: str, session_id: str, target_word: str, 
                            attempts: int, completed: bool, daily_word: bool):
        """Save game statistics for a specific user"""
        stats = self._load_stats()
        
        if user_id not in stats:
            stats[user_id] = {
                "total_games": 0,
                "completed_games": 0,
                "total_attempts": 0,
                "games_history": []
            }
        
        stats[user_id]["total_games"] += 1
        if completed:
            stats[user_id]["completed_games"] += 1
            stats[user_id]["total_attempts"] += attempts
        
        # Add to history
        game_record = {
            "session_id": session_id,
            "target_word": target_word,
            "attempts": attempts,
            "completed": completed,
            "daily_word": daily_word,
            "date": datetime.now().isoformat()
        }
        stats[user_id]["games_history"].append(game_record)
        
        # Keep only last 100 games
        stats[user_id]["games_history"] = stats[user_id]["games_history"][-100:]
        
        # Save to file
        with open(self.stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)

    def _load_stats(self) -> Dict:
        """Load statistics from file"""
        if not self.stats_file.exists():
            return {}
        
        try:
            with open(self.stats_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}

    def get_user_stats(self, user_id: str = "default") -> Dict:
        """Get user statistics"""
        stats = self._load_stats()
        
        if user_id not in stats:
            return {
                "total_games": 0,
                "completed_games": 0,
                "average_attempts": 0,
                "best_score": 0,
                "games_history": []
            }
        
        user_stats = stats[user_id]
        completed_games = user_stats.get("completed_games", 0)
        total_attempts = user_stats.get("total_attempts", 0)
        
        average_attempts = (
            total_attempts / completed_games 
            if completed_games > 0 else 0
        )
        
        # Best score is minimum attempts
        games_history = user_stats.get("games_history", [])
        completed_games_list = [g for g in games_history if g.get("completed", False)]
        best_score = (
            min(g["attempts"] for g in completed_games_list)
            if completed_games_list else 0
        )
        
        return {
            "total_games": user_stats.get("total_games", 0),
            "completed_games": completed_games,
            "average_attempts": round(average_attempts, 2),
            "best_score": best_score,
            "games_history": games_history[-20:]  # Last 20 games
        }
