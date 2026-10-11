import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI(title="Nexus OS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://rameshkannan1472014-star.github.io",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"name": "Nexus OS API", "status": "online", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "nexus-os-api"}

@app.get("/api/youtube/search")
def youtube_search(q: str = Query(min_length=1, max_length=100), mode: str = "videos", pageToken: str | None = None):
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="YouTube search is not configured yet. Add YOUTUBE_API_KEY in Render Environment."
        )
    try:
        response = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "type": "video",
                "maxResults": 20,
                "pageToken": pageToken,
                "videoDuration": "short" if mode == "shorts" else "any",
                "safeSearch": "strict",
                "q": q,
                "key": api_key,
            },
            timeout=15,
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="YouTube search request failed.")
        payload = response.json()
        return {
            "nextPageToken": payload.get("nextPageToken"),
            "items": [
                {
                    "videoId": item.get("id", {}).get("videoId"),
                    "title": item.get("snippet", {}).get("title", ""),
                    "channel": item.get("snippet", {}).get("channelTitle", ""),
                    "channelId": item.get("snippet", {}).get("channelId", ""),
                    "thumbnail": item.get("snippet", {}).get("thumbnails", {}).get("medium", {}).get("url", ""),
                }
                for item in payload.get("items", [])
                if item.get("id", {}).get("videoId")
            ]
        }
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach YouTube right now.")
