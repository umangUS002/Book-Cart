# sentiment-service/app.py
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

# Make sure this variable is named exactly "app"
app = FastAPI(title="Sentiment Service")

# instantiate the HF pipeline at module import (may download weights on first run)
# NOTE: transformers will try to use torch. If torch isn't installed you'll see an error.
sentiment_model = pipeline("sentiment-analysis")

class Payload(BaseModel):
    text: str

def map_label_to_score(label: str, score: float):
    # convert POSITIVE/NEGATIVE into a signed score and map to categories
    s = score if label.upper().startswith("POS") else -score
    if s >= 0.6:
        cat = "excellent"
    elif s >= 0.2:
        cat = "good"
    elif s <= -0.2:
        cat = "poor"
    else:
        cat = "avg"
    return {"score": float(s), "label": cat}

@app.post("/analyze")
def analyze(p: Payload):
    # truncate long text to avoid extremely long model inputs
    out = sentiment_model(p.text[:512])
    return map_label_to_score(out[0]["label"], out[0]["score"])
