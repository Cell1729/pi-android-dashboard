from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

# .envの読み込み
load_dotenv()

app = FastAPI()

# Spotifyの認証設定
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=os.getenv('SPOTIFY_CLIENT_ID'),
    client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
    redirect_uri=os.getenv('SPOTIFY_CLIENT_URI'),
    scope="user-read-currently-playing user-modify-playback-state"
))


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "frontend"))
STATIC_DIR = os.path.join(FRONTEND_DIR, "static") # frontend/static を指す

if not os.path.exists(STATIC_DIR):
    print(f"警告: 静的フォルダが見つかりません: {STATIC_DIR}")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def read_index():
    # index.html は frontend 直下にある想定
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/api/spotify/current")
async def get_spotify_current():
    try:
        track = sp.current_user_currently_playing()
        if track is not None and track['is_playing']:
            return {
                "is_playing": True,
                "title": track['item']['name'],
                "artist": track['item']['artists'][0]['name'],
                "image_url": track['item']['album']['images'][0]['url']
            }
        return {"is_playing": False, "message": "再生中ではありません"}
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/api/spotify/play")
async def play_spotify():
    try:
        sp.start_playback()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/spotify/pause")
async def pause_spotify():
    try:
        sp.pause_playback()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/spotify/next")
async def next_spotify():
    try:
        sp.next_track()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/spotify/prev")
async def prev_spotify():
    try:
        sp.previous_track()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}
    
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload