from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
import requests

# .envの読み込み
load_dotenv()

app = FastAPI()

# Spotifyの認証設定
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=os.getenv('SPOTIFY_CLIENT_ID'),
    client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
    redirect_uri=os.getenv('SPOTIFY_CLIENT_URI'),
    scope="user-read-currently-playing user-modify-playback-state user-read-playback-state"
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
        # メソッドを変更: current_playback() はより安定しています
        playback = sp.current_playback()
        
        # 何も再生されていない（またはデバイスがアクティブでない）場合
        if playback is None:
            return {"is_playing": False, "message": "デバイスがアクティブではありません"}

        if playback['is_playing'] and playback['item'] is not None:
            return {
                "is_playing": True,
                "title": playback['item']['name'],
                "artist": playback['item']['artists'][0]['name'],
                "image_url": playback['item']['album']['images'][0]['url']
            }
        
        return {"is_playing": False, "message": "停止中"}
        
    except Exception as e:
        # エラーメッセージを返す
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
        # 現在アクティブなデバイスを探す
        devices = sp.devices()
        active_device = next((d for d in devices['devices'] if d['is_active']), None)
        
        if active_device:
            sp.pause_playback(device_id=active_device['id'])
        else:
            # アクティブなデバイスがない場合は、とりあえず最初のデバイスを止めてみる
            sp.pause_playback()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/spotify/toggle")
async def toggle_spotify():
    try:
        playback = sp.current_playback()
        if playback and playback['is_playing']:
            sp.pause_playback()
            return {"status": "paused"}
        else:
            sp.start_playback()
            return {"status": "playing"}
    except Exception as e:
        # Restriction violated を含むエラーを詳細に返す
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

@app.get("/api/spotify/volume")
async def set_spotify_volume(value: int):
    try:
        # 0〜100の範囲で音量を設定
        sp.volume(value)
        return {"status": "success", "volume": value}
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/api/spotify/devices")
async def get_devices():
    devices = sp.devices()
    return devices['devices'] # 名前、ID、アクティブかどうかが返る


@app.get("/api/weather")
async def get_weather():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    lat = "35.4433" # 横浜市の緯度
    lon = "139.6333" # 横浜市の経度
    
    # 現在の天気と予報を同時に取得する例
    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=ja"
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=ja"
    
    curr_res = requests.get(current_url).json()
    fore_res = requests.get(forecast_url).json()
    
    return {
        "current": {
            "temp": curr_res['main']['temp'],
            "humidity": curr_res['main']['humidity'],
            "pressure": curr_res['main']['pressure'],
            "description": curr_res['weather'][0]['description'],
            "icon": curr_res['weather'][0]['icon']
        },
        "forecast": fore_res['list'][:4] # 3時間おき×4個 = 12時間分
    }

# uvicorn main:app --host 0.0.0.0 --port 8000 --reload