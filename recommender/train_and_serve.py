# train_and_serve.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import joblib
from typing import List, Dict

# Filenames & small config
BOOKS_CSV = "toy_books.csv"
VEC_FILE = "tfidf_vectorizer.joblib"
MAT_FILE = "tfidf_matrix.joblib"
META_FILE = "books_meta.joblib"

# Helper to build a combined text for each book
def build_text(df: pd.DataFrame) -> pd.Series:
    # join title, description, genres and authors into one text
    title = df['title'].fillna('')
    desc = df['description'].fillna('')
    authors = df['authors'].fillna('')
    genres = df['genres'].fillna('')
    # replace separators in genres (if semicolon) with space
    genres = genres.str.replace(';', ' ')
    combined = title + ' ' + desc + ' ' + authors + ' ' + genres
    return combined

def train_tfidf(csv_path: str):
    df = pd.read_csv(csv_path, dtype=str)
    # ensure id column exists
    if 'id' not in df.columns:
        raise ValueError("CSV must contain 'id' column")
    df = df.fillna('')
    df['text'] = build_text(df)
    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    mat = vectorizer.fit_transform(df['text'].values)
    # persist artifacts
    joblib.dump(vectorizer, VEC_FILE)
    joblib.dump(mat, MAT_FILE)
    joblib.dump(df, META_FILE)
    print(f"Trained vectorizer on {len(df)} books. Artifacts saved.")

# If artifacts exist, load them; otherwise train
if not (os.path.exists(VEC_FILE) and os.path.exists(MAT_FILE) and os.path.exists(META_FILE)):
    print("Artifacts not found — training TF-IDF from CSV.")
    if not os.path.exists(BOOKS_CSV):
        raise FileNotFoundError(f"{BOOKS_CSV} not found in working directory.")
    train_tfidf(BOOKS_CSV)

# Load artifacts
vectorizer = joblib.load(VEC_FILE)
mat = joblib.load(MAT_FILE)  # sparse matrix
books_df: pd.DataFrame = joblib.load(META_FILE)
# ensure consistent index mapping: map id (string) -> row index
books_df = books_df.reset_index(drop=True)
id_to_idx = {str(r['id']): i for i, r in books_df.iterrows()}

# FastAPI app
app = FastAPI(title="TF-IDF Recommender Service")

class SimilarResponse(BaseModel):
    id: str
    title: str
    authors: str
    genres: str
    description: str
    score: float

@app.get("/similar/{book_id}", response_model=List[SimilarResponse])
def similar(book_id: str, k: int = 5):
    """
    Return top-k books similar to given book_id using cosine similarity on TF-IDF.
    """
    if book_id not in id_to_idx:
        raise HTTPException(status_code=404, detail="Book id not found")
    idx = id_to_idx[book_id]
    v = mat[idx]
    sims = linear_kernel(v, mat).flatten()
    # get top indices in descending order, skip the book itself
    topk = sims.argsort()[::-1]
    results = []
    count = 0
    for i in topk:
        if i == idx:
            continue
        row = books_df.iloc[i].to_dict()
        results.append({
            "id": str(row.get("id", "")),
            "title": row.get("title", ""),
            "authors": row.get("authors", ""),
            "genres": row.get("genres", ""),
            "description": row.get("description", ""),
            "score": float(sims[i])
        })
        count += 1
        if count >= k:
            break
    return results

@app.get("/recommendations/{user_id}", response_model=List[SimilarResponse])
def recommendations(user_id: str, k: int = 10):
    """
    Naive recommendations for a user.
    If there's an 'interactions.csv' file with columns userId,bookId,type,value,
    the function will compute an average vector of books the user interacted with (weights optional)
    and return top-k nearest books. Otherwise fall back to top-popular by vector magnitude.
    """
    interactions_file = "interactions.csv"
    # If interactions exist, build user vector
    if os.path.exists(interactions_file):
        interactions = pd.read_csv(interactions_file, dtype=str).fillna('')
        # filter for this user
        user_rows = interactions[interactions['userId'] == user_id]
        if len(user_rows) > 0:
            # gather book indices for user's interacted books
            idxs = []
            for bid in user_rows['bookId'].values:
                bid_s = str(bid)
                if bid_s in id_to_idx:
                    idxs.append(id_to_idx[bid_s])
            if len(idxs) == 0:
                # no known books - fall back
                pass
            else:
                # compute mean vector (dense) for user
                # mat is sparse — sum rows and normalize
                user_vec = mat[idxs].mean(axis=0)
                sims = linear_kernel(user_vec, mat).flatten()
                topk = sims.argsort()[::-1]
                results = []
                count = 0
                for i in topk:
                    row = books_df.iloc[i].to_dict()
                    results.append({
                        "id": str(row.get("id", "")),
                        "title": row.get("title", ""),
                        "authors": row.get("authors", ""),
                        "genres": row.get("genres", ""),
                        "description": row.get("description", ""),
                        "score": float(sims[i])
                    })
                    count += 1
                    if count >= k:
                        break
                return results
    # Fallback: return top-k books by TF-IDF vector magnitude (proxy for 'content richness'/popularity)
    magnitudes = np.array(mat.sum(axis=1)).flatten()
    topk = magnitudes.argsort()[::-1][:k]
    res = []
    for i in topk:
        row = books_df.iloc[i].to_dict()
        res.append({
            "id": str(row.get("id", "")),
            "title": row.get("title", ""),
            "authors": row.get("authors", ""),
            "genres": row.get("genres", ""),
            "description": row.get("description", ""),
            "score": float(magnitudes[i])
        })
    return res

# Health check
@app.get("/health")
def health():
    return {"status": "ok", "n_books": len(books_df)}
