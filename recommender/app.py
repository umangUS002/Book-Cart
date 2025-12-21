import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import joblib
from dotenv import load_dotenv

# =======================
# CONFIG
# =======================

load_dotenv()  # <-- MUST be before getenv
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set")


from fastapi.middleware.cors import CORSMiddleware

DB_NAME = "test"
BOOKS_COLLECTION = "books"
INTERACTIONS_COLLECTION = "interactions"

VEC_FILE = "tfidf_vectorizer.joblib"
MAT_FILE = "tfidf_matrix.joblib"
META_FILE = "books_meta.joblib"

# =======================
# MONGODB CONNECTION
# =======================
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
books_col = db[BOOKS_COLLECTION]
interactions_col = db[INTERACTIONS_COLLECTION]

# =======================
# FASTAPI APP
# =======================
app = FastAPI(title="MongoDB TF-IDF Recommender")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================
# HELPERS
# =======================
def build_text(df: pd.DataFrame) -> pd.Series:
    return (
        df["title"].fillna("") + " " +
        df["description"].fillna("") + " " +
        df["author"].fillna("") + " " +
        df["genre"].fillna("") + 
        df["image"].fillna("") + " "
    )

def load_books_from_mongo():
    docs = list(books_col.find({}))
    for d in docs:
        d["id"] = str(d["_id"])   # 👈 map _id → id
        del d["_id"]
    df = pd.DataFrame(docs).astype(str).fillna("")
    return df.reset_index(drop=True)

def train_tfidf_from_mongo():
    df = load_books_from_mongo()
    df["text"] = build_text(df)

    vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words="english"
    )
    mat = vectorizer.fit_transform(df["text"])

    joblib.dump(vectorizer, VEC_FILE)
    joblib.dump(mat, MAT_FILE)
    joblib.dump(df, META_FILE)

    print(f"✅ TF-IDF trained on {len(df)} books")

# =======================
# LOAD OR TRAIN
# =======================
if not (os.path.exists(VEC_FILE) and os.path.exists(MAT_FILE) and os.path.exists(META_FILE)):
    print("🔁 Artifacts not found, training from MongoDB...")
    train_tfidf_from_mongo()

vectorizer = joblib.load(VEC_FILE)
mat = joblib.load(MAT_FILE)
books_df: pd.DataFrame = joblib.load(META_FILE)

id_to_idx = {str(row["id"]): i for i, row in books_df.iterrows()}

# =======================
# RESPONSE MODELS
# =======================
class BookResponse(BaseModel):
    id: str
    title: str
    author: str
    genre: str
    description: str
    score: float
    image: str

# =======================
# API ENDPOINTS
# =======================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "n_books": len(books_df)
    }

@app.post("/retrain")
def retrain():
    train_tfidf_from_mongo()
    global vectorizer, mat, books_df, id_to_idx
    vectorizer = joblib.load(VEC_FILE)
    mat = joblib.load(MAT_FILE)
    books_df = joblib.load(META_FILE)
    id_to_idx = {str(row["id"]): i for i, row in books_df.iterrows()}
    return {"status": "retrained", "n_books": len(books_df)}

@app.get("/similar/{book_id}", response_model=List[BookResponse])
def similar_books(book_id: str, k: int = 4):
    if book_id not in id_to_idx:
        raise HTTPException(status_code=404, detail="Book not found")

    idx = id_to_idx[book_id]
    sims = linear_kernel(mat[idx], mat).flatten()
    top_idx = sims.argsort()[::-1]

    results = []
    for i in top_idx:
        if i == idx:
            continue
        row = books_df.iloc[i]
        results.append({
            "id": str(row["id"]),
            "title": row["title"],
            "author": row["author"],
            "genre": row["genre"],
            "description": row["description"],
            "score": float(sims[i]),
            "image": row["image"]
        })
        if len(results) >= k:
            break

    return results

@app.get("/recommendations/{user_id}", response_model=List[BookResponse])
def recommendations(user_id: str, k: int = 10):
    interactions = list(interactions_col.find({"userId": user_id}))

    if interactions:
        idxs = [
            id_to_idx[str(i["bookId"])]
            for i in interactions
            if str(i["bookId"]) in id_to_idx
        ]

        if idxs:
            user_vec = mat[idxs].mean(axis=0)
            sims = linear_kernel(user_vec, mat).flatten()
            top_idx = sims.argsort()[::-1][:k]

            return [{
                "id": str(books_df.iloc[i]["id"]),
                "title": books_df.iloc[i]["title"],
                "author": books_df.iloc[i]["author"],
                "genre": books_df.iloc[i]["genre"],
                "description": books_df.iloc[i]["description"],
                "score": float(sims[i]),
                "image" : books_df.iloc[i]["image"]
            } for i in top_idx]

    # Fallback: popular/content-rich
    magnitudes = np.array(mat.sum(axis=1)).flatten()
    top_idx = magnitudes.argsort()[::-1][:k]

    return [{
        "id": str(books_df.iloc[i]["id"]),
        "title": books_df.iloc[i]["title"],
        "author": books_df.iloc[i]["author"],
        "genre": books_df.iloc[i]["genre"],
        "description": books_df.iloc[i]["description"],
        "score": float(magnitudes[i]),
        "image" : books_df.iloc[i]["image"]
    } for i in top_idx]
