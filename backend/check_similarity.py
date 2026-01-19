"""
Check similarity between "level" and "animal" using OpenAI Embeddings
"""

import subprocess
import sys
import os

# Try to install required packages
try:
    import numpy as np
    from openai import OpenAI
except ImportError:
    print("Installing packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "numpy", "openai", "-q"])
    import numpy as np
    from openai import OpenAI

from numpy.linalg import norm
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file if it exists
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Get API key from environment variable
API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise ValueError(
        "OPENAI_API_KEY environment variable is not set.\n"
        "Please set it using one of the following methods:\n"
        "  1. Create a .env file in the backend directory:\n"
        "     OPENAI_API_KEY=your-api-key-here\n"
        "  2. Set environment variable:\n"
        "     Windows PowerShell: $env:OPENAI_API_KEY='your-api-key-here'\n"
        "     Windows CMD: set OPENAI_API_KEY=your-api-key-here\n"
        "     Linux/Mac: export OPENAI_API_KEY='your-api-key-here'"
    )

def get_embedding(word):
    """
    Get embedding vector for a word using OpenAI API
    Documentation: https://platform.openai.com/docs/api-reference/embeddings/create
    """
    client = OpenAI(api_key=API_KEY)
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=word,
        encoding_format="float"  # Explicit format: float (default) or base64
    )
    # Response structure: {"data": [{"embedding": [...], "index": 0, "object": "embedding"}], ...}
    return np.array(response.data[0].embedding)

def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (norm(vec1) * norm(vec2))

# Test
target_word = "animal"
guess_word = "level"

print("Checking similarity...")
print(f"TARGET: {target_word}")
print(f"GUESS: {guess_word}")
print("-" * 50)

try:
    vec_target = get_embedding(target_word)
    vec_guess = get_embedding(guess_word)
    
    score = cosine_similarity(vec_guess, vec_target)
    
    print("-" * 50)
    print("RESULTS:")
    print(f"Cosine similarity (0-1): {score:.6f}")
    print(f"Percentage (0-100%): {score * 100:.2f}%")
    print(f"Score (1-1000): {1 + (score * 999):.2f}")
    print("-" * 50)
    print(f"Word '{guess_word}' has {score * 100:.2f}% semantic similarity to '{target_word}'")
    
    # Also save to file
    with open("similarity_result.txt", "w", encoding="utf-8") as f:
        f.write(f"TARGET: {target_word}\n")
        f.write(f"GUESS: {guess_word}\n")
        f.write(f"Cosine similarity: {score:.6f}\n")
        f.write(f"Percentage: {score * 100:.2f}%\n")
        f.write(f"Score (1-1000): {1 + (score * 999):.2f}\n")
    
    print("\nResult saved to similarity_result.txt")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
