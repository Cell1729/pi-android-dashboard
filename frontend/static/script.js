// 再生状態の管理
let isPlaying = false;

// 時計
document.addEventListener('DOMContentLoaded', () => {
    // ここに初期実行したい関数を入れる
    updateClock();
    updateSpotify();

    // タイマー設定
    setInterval(updateClock, 1000);
    setInterval(updateSpotify, 5000);
});

// 各関数（updateClock, updateSpotifyなど）の定義は外側でOK
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('ja-JP');
    }
}

// Spotify 状態更新
async function updateSpotify() {
    try {
        const response = await fetch('/api/spotify/current');
        const data = await response.json();
        
        // デバッグ用：取得したデータをコンソールに表示
        console.log("Spotify Data:", data);

        const imgEl = document.getElementById('album-art');
        const titleEl = document.getElementById('track-title');
        
        // 要素が見つからない場合はここで終了（エラー回避）
        if (!imgEl || !titleEl) return;

        if (data.is_playing && data.image_url) {
            isPlaying = true;
            titleEl.innerText = data.title;
            
            // 画像の設定と表示
            imgEl.src = data.image_url;
            imgEl.style.display = 'block'; // ここで「隠す」を解除
            console.log("Image source set to:", data.image_url);
        } else {
            isPlaying = false;
            titleEl.innerText = "Spotify 停止中";
            imgEl.style.display = 'none'; // 再生していないときは隠す
        }
    } catch (e) {
        console.error("Update error:", e);
    }
}


setInterval(updateSpotify, 5000);
updateSpotify();

// 操作関数
async function controlSpotify(action) {
    await fetch(`/api/spotify/${action}`);
    setTimeout(updateSpotify, 500);
}

async function togglePlay() {
    try {
        const response = await fetch('/api/spotify/toggle');
        const data = await response.json();
        if (data.error) console.error(data.error);
        
        // 操作後に少し待ってからUIを更新
        setTimeout(updateSpotify, 500);
    } catch (e) {
        console.error(e);
    }
}

async function setVolume(val) {
    try {
        await fetch(`/api/spotify/volume?value=${val}`);
        console.log("Volume updated to:", val);
    } catch (e) {
        console.error("Volume control error:", e);
    }
}

// --- 追加：天気情報の取得 ---
async function updateWeather() {
    try {
        const response = await fetch('/api/weather');
        const data = await response.json();
        const curr = data.current;

        // 現在の天気を反映
        document.getElementById('temp-curr').innerText = Math.round(curr.temp);
        document.getElementById('pressure').innerText = curr.pressure;
        document.getElementById('humidity').innerText = curr.humidity;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${curr.icon}@2x.png`;

        // 予報の反映 (12時間分 = 3時間×4個)
        const forecastList = document.getElementById('forecast-list');
        forecastList.innerHTML = ''; // 一旦クリア
        
        data.forecast.forEach(item => {
            const time = new Date(item.dt * 1000).getHours();
            const temp = Math.round(item.main.temp);
            const icon = item.weather[0].icon;

            const html = `
                <div class="forecast-item">
                    <div class="f-time">${time}:00</div>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
                    <div class="f-temp">${temp}°C</div>
                </div>
            `;
            forecastList.insertAdjacentHTML('beforeend', html);
        });
    } catch (e) { console.error("Weather error:", e); }
}

// --- 既存のupdateSpotifyにデバイス名取得を追加 ---
async function updateSpotify() {
    try {
        // 現在の曲を取得
        const response = await fetch('/api/spotify/current');
        const data = await response.json();
        
        // デバイス名を取得
        const devRes = await fetch('/api/spotify/devices');
        const devices = await devRes.json();
        const activeDev = devices.find(d => d.is_active);

        const titleEl = document.getElementById('track-title');
        const deviceEl = document.getElementById('device-info');
        const imgEl = document.getElementById('album-art');

        if (data.is_playing) {
            isPlaying = true;
            titleEl.innerText = data.title;
            document.getElementById('track-artist').innerText = data.artist;
            imgEl.src = data.image_url;
            imgEl.style.display = 'block';
            deviceEl.innerText = activeDev ? `🎧 ${activeDev.name}` : "";
        } else {
            isPlaying = false;
            titleEl.innerText = "Spotify 停止中";
            imgEl.style.display = 'none';
            deviceEl.innerText = "";
        }
    } catch (e) {}
}

// 起動時に天気を取得し、30分ごとに更新
updateWeather();
setInterval(updateWeather, 1800000);