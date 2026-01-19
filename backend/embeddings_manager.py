"""
Embeddings Manager
Handles word embeddings and similarity calculations
Uses OpenAI embeddings for semantic similarity

OpenAI API Documentation:
https://platform.openai.com/docs/api-reference/embeddings/create

Model: text-embedding-3-large
- Produces 3072-dimensional embeddings
- Supports up to 8,192 tokens input
- Returns float arrays by default
"""

import numpy as np
from typing import Optional, Dict
import os
from pathlib import Path

from openai import OpenAI
from numpy.linalg import norm
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two vectors
    Returns value in range [-1, 1] where 1 = identical, 0 = orthogonal, -1 = opposite
    
    Formula: cosine_similarity = dot(vec1, vec2) / (norm(vec1) * norm(vec2))
    """
    return np.dot(vec1, vec2) / (norm(vec1) * norm(vec2))


class EmbeddingsManager:
    """Manages word embeddings and similarity calculations using OpenAI"""
    
    def __init__(self):
        # Get API key from environment variable
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            is_railway = os.getenv("RAILWAY_ENVIRONMENT") is not None or os.getenv("RAILWAY") is not None
            error_msg = "OPENAI_API_KEY environment variable is not set.\n\n"
            if is_railway:
                error_msg += (
                    "🚨 Railway Deployment: Set the environment variable in Railway dashboard:\n"
                    "   1. Go to your Railway project → Service → Variables tab\n"
                    "   2. Click 'New Variable'\n"
                    "   3. Name: OPENAI_API_KEY\n"
                    "   4. Value: your-openai-api-key-here\n"
                    "   5. Click 'Add' and redeploy\n\n"
                )
            error_msg += (
                "For local development:\n"
                "  1. Create a .env file in the backend directory:\n"
                "     OPENAI_API_KEY=your-api-key-here\n"
                "  2. Or set environment variable:\n"
                "     Windows PowerShell: $env:OPENAI_API_KEY='your-api-key-here'\n"
                "     Windows CMD: set OPENAI_API_KEY=your-api-key-here\n"
                "     Linux/Mac: export OPENAI_API_KEY='your-api-key-here'"
            )
            raise ValueError(error_msg)
        
        self.client = OpenAI(api_key=api_key)
        self.embeddings_cache: Dict[str, np.ndarray] = {}
    
    def get_embedding(self, word: str) -> np.ndarray:
        """
        Get embedding vector for a word using OpenAI API
        
        Args:
            word: The word to get embedding for
            
        Returns:
            numpy array containing the embedding vector
        """
        word = word.lower()
        
        # Check cache first
        if word in self.embeddings_cache:
            return self.embeddings_cache[word]
        
        # Get embedding from OpenAI API
        response = self.client.embeddings.create(
            model="text-embedding-3-large",
            input=word
        )
        
        # Extract embedding vector from response
        embedding_vector = np.array(response.data[0].embedding)
        
        # Cache the embedding for future use
        self.embeddings_cache[word] = embedding_vector
        
        return embedding_vector
    
    def is_word_valid(self, word: str) -> bool:
        """
        Validate word through OpenAI embeddings
        If we can get embeddings for a word, it's considered valid
        """
        word = word.lower().strip()
        if not word:
            return False

        # Check cache first (if we have embedding, word was validated before)
        if word in self.embeddings_cache:
            return True

        try:
            # Try to get embedding - if successful, word is valid
            self.get_embedding(word)
            return True
        except Exception as e:
            # If we can't get embeddings, word is not valid
            print(f"Word '{word}' is not valid (OpenAI error: {e})")
            return False
    
    def calculate_similarity(self, word1: str, word2: str) -> float:
        """
        Calculate cosine similarity between two words using OpenAI embeddings
        Returns value between 0 and 1
        """
        word1 = word1.lower()
        word2 = word2.lower()
        
        if word1 == word2:
            return 1.0
        
        # Get embeddings for both words
        emb1 = self.get_embedding(word1)
        emb2 = self.get_embedding(word2)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(emb1, emb2)
        # Clamp to [0, 1] range
        similarity = max(0.0, min(1.0, similarity))
        
        return float(similarity)
    
    def get_similarity_rank(self, word: str, target_word: str) -> int:
        """
        Get rank of word's similarity to target
        Rank 0 = perfect match
        Since we no longer have a fixed vocabulary, we return a simple rank based on similarity score
        """
        word = word.lower()
        target_word = target_word.lower()
        
        if word == target_word:
            return 0  # Perfect match
        
        # Return rank 1 for all non-matching words
        # The rank functionality is simplified since we don't have a fixed vocabulary anymore
        return 1
