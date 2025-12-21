from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from transformers import pipeline
from bson import ObjectId
import numpy as np
import os

# ================== APP ==================
app = FastAPI(title="Sentiment Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== ENV ==================
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set")

DB_NAME = "test"
COMMENTS_COLLECTION = "comments"

# ================== DB ==================
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
comments_col = db[COMMENTS_COLLECTION]

print("✅ Connected to DB:", db.name)

# ================== NLP MODEL ==================
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment"
)

# ================== HELPERS ==================
def compute_sentiment(stars: int):
    """
    Convert 1–5 stars → sentiment score [-1, +1]
    """
    score = round((stars - 3) / 2, 3)

    label = (
        "positive" if score > 0.2
        else "negative" if score < -0.2
        else "neutral"
    )

    return score, label


# ================== ROUTES ==================

from pydantic import BaseModel

class CommentRequest(BaseModel):
    text: str


@app.post("/analyze/comment")
def analyze_comment(payload: CommentRequest):
    text = payload.text

    if not text or len(text.strip()) < 3:
        return {"error": "Text too short"}

    result = sentiment_analyzer(text)[0]
    stars = int(result["label"][0])

    score = round((stars - 3) / 2, 3)
    label = (
        "positive" if score > 0.2
        else "negative" if score < -0.2
        else "neutral"
    )

    return {
        "sentiment": {
            "score": score,
            "label": label
        }
    }


@app.post("/analyze/comment/{comment_id}")
def analyze_and_store(comment_id: str):
    """
    Analyze an EXISTING comment and STORE sentiment in MongoDB
    (Useful for re-analysis / moderation)
    """
    try:
        cid = ObjectId(comment_id)
    except Exception:
        return {"error": "Invalid comment ID"}

    comment = comments_col.find_one({"_id": cid})
    if not comment:
        return {"error": "Comment not found"}

    text = comment.get("content", "")
    if not text:
        return {"error": "No content to analyze"}

    result = sentiment_analyzer(text)[0]
    stars = int(result["label"][0])

    score, label = compute_sentiment(stars)

    comments_col.update_one(
        {"_id": cid},
        {
            "$set": {
                "sentiment": {
                    "score": score,
                    "label": label
                }
            }
        }
    )

    return {
        "message": "Sentiment stored successfully",
        "sentiment": {
            "score": score,
            "label": label
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}
