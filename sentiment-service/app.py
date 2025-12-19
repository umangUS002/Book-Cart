from fastapi import FastAPI
from pymongo import MongoClient
from bson import ObjectId
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

# ================== APP ==================
app = FastAPI(title="AI Review Analysis Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== DB CONFIG ==================
MONGO_URI = "mongodb+srv://umang:umang123@cluster0.uefjr9a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "test"

BOOKS_COLLECTION = "books"
COMMENTS_COLLECTION = "comments"
INTERACTIONS_COLLECTION = "interactions"

# ================== DB CONNECTION ==================
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

books_col = db[BOOKS_COLLECTION]
comments_col = db[COMMENTS_COLLECTION]
interactions_col = db[INTERACTIONS_COLLECTION]

# ================== DEBUG CHECK ==================
print("Connected DB:", db.name)
print("Collections:", db.list_collection_names())
print("TOTAL COMMENTS:", comments_col.count_documents({}))


# ================== API ==================
@app.get("/analyze/book/{book_id}")
def analyze_book(book_id: str):

    # Validate ObjectId
    try:
        book_oid = ObjectId(book_id)
    except Exception:
        return {"error": "Invalid book_id format"}

    comments = list(comments_col.find({
        "book": book_oid,
        "isApproved": True,
        "sentiment.score": {"$exists": True}
    }))

    if not comments:
        return {
            "rating": 0,
            "totalReviews": 0,
            "summary": "No reviews available yet."
        }

    scores = np.array([c["sentiment"]["score"] for c in comments])

    avg_score = float(np.mean(scores))
    std_dev = float(np.std(scores))

    # ML-based star mapping (continuous → discrete)
    stars = round(((avg_score + 1) / 2) * 4 + 1, 1)

    summary = (
        f"Based on {len(scores)} customer reviews, customers find this product excellent overall."
        if avg_score > 0.5
        else "Customer opinions are mixed."
    )

    return {
        "rating": stars,
        "avgSentiment": round(avg_score, 3),
        "confidence": round(1 - std_dev, 2),
        "totalReviews": len(scores),
        "summary": summary
    }
