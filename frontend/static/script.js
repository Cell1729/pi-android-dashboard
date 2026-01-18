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

// デバイスリストの表示/非表示を切り替え
function toggleDeviceList() {
    const list = document.getElementById('device-list');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
}

// デバイスを切り替える関数
async function switchDevice(deviceId) {
    await fetch(`/api/spotify/transfer/${deviceId}`);
    document.getElementById('device-list').style.display = 'none';
    setTimeout(updateSpotify, 500); // 状態を更新
}

// Spotify 状態更新
async function updateSpotify() {
    try {
        // 現在の曲とデバイス一覧を同時に取得
        const [currRes, devRes] = await Promise.all([
            fetch('/api/spotify/current'),
            fetch('/api/spotify/devices')
        ]);
        
        const data = await currRes.json();
        const devices = await devRes.json();
        
        const imgEl = document.getElementById('album-art');
        const titleEl = document.getElementById('track-title');
        const deviceEl = document.getElementById('device-info');
        const listEl = document.getElementById('device-list');
        
        if (!imgEl || !titleEl || !deviceEl) return;

        // --- 曲情報の更新 ---
        if (data.is_playing && data.image_url) {
            isPlaying = true;
            titleEl.innerText = data.title;
            imgEl.src = data.image_url;
            imgEl.style.display = 'block';
        } else {
            isPlaying = false;
            titleEl.innerText = "Spotify 停止中";
            imgEl.src = "/static/no_track.png"; // 前に作ったデフォルト画像
            imgEl.style.display = 'block';
        }

        // --- デバイス一覧の更新 ---
        const activeDev = devices.find(d => d.is_active);
        deviceEl.innerText = activeDev ? `🎧 ${activeDev.name.toUpperCase()}` : "🎧 SELECT DEVICE";

        listEl.innerHTML = devices.map(d => `
            <div class="device-item ${d.is_active ? 'active' : ''}" onclick="switchDevice('${d.id}')">
                <span>${d.name}</span>
                <span>${d.is_active ? '●' : ''}</span>
            </div>
        `).join('');

    } catch (e) {
        console.error("Update error:", e);
    }
}

// 画面のどこかをクリックしたらリストを閉じる（利便性のため）
window.addEventListener('click', (e) => {
    if (!e.target.closest('.device-selector-container')) {
        document.getElementById('device-list').style.display = 'none';
    }
});

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
        const [currRes, devRes] = await Promise.all([
            fetch('/api/spotify/current'),
            fetch('/api/spotify/devices')
        ]);
        const data = await currRes.json();
        const devices = await devRes.json();
        
        const activeDev = devices.find(d => d.is_active);
        const titleEl = document.getElementById('track-title');
        const artistEl = document.getElementById('track-artist');
        const imgEl = document.getElementById('album-art');
        const deviceEl = document.getElementById('device-info');
        const btnEl = document.getElementById('play-pause-btn');

        if (!titleEl || !imgEl) return;

        // デフォルト画像のパス
        const NO_TRACK_IMAGE = "/static/image/no_track.jpg";

        if (data.is_playing && data.image_url) {
            isPlaying = true;
            titleEl.innerText = data.title;
            if (artistEl) artistEl.innerText = data.artist;
            imgEl.src = data.image_url;
            imgEl.style.display = 'block';
            if (btnEl) btnEl.innerText = '||';
            if (deviceEl) deviceEl.innerText = activeDev ? `🎧 ${activeDev.name}` : "";
        } else {
            // ★再生していない時の処理を修正
            isPlaying = false;
            titleEl.innerText = "Spotify 停止中";
            if (artistEl) artistEl.innerText = "曲を選択してください";
            
            imgEl.src = NO_TRACK_IMAGE; // 未再生用画像を表示
            imgEl.style.display = 'block'; // 非表示にせず表示させる
            
            if (btnEl) btnEl.innerText = '▶';
            if (deviceEl) deviceEl.innerText = "";
        }
    } catch (e) { 
        console.error("Spotify error:", e); 
    }
}
async function updateCalendar() {
    try {
        const res = await fetch('/api/calendar');
        const events = await res.json();
        const calEl = document.getElementById('calendar-events');
        
        if (!events || events.length === 0) {
            calEl.innerHTML = '<p style="text-align:center; opacity:0.5;">No upcoming events</p>';
            return;
        }

        calEl.innerHTML = events.map(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            const month = start.getMonth() + 1;
            const day = start.getDate();
            // updateCalendar関数の一部を修正
            const timeStr = event.start.dateTime 
                ? start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) 
                : "終日"; // ALL DAY を「終日」にして横幅を節約

            return `
                <div class="event-item">
                    <div class="event-date-box">
                        <span class="month">${month}月</span>
                        <span class="day">${day}</span>
                    </div>
                    <div class="event-details">
                        <span class="event-time">${timeStr}</span>
                        <span class="event-title">${event.summary}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Calendar update error:", e);
    }
}
async function updateResources() {
    try {
        const res = await fetch('/api/resources');
        const data = await res.json();
        
        // CPU, RAM の更新（既存コード）
        document.getElementById('cpu-bar').style.width = `${data.cpu}%`;
        document.getElementById('cpu-text').innerText = `${Math.round(data.cpu)}%`;
        document.getElementById('ram-bar').style.width = `${data.ram}%`;
        document.getElementById('ram-text').innerText = `${Math.round(data.ram)}%`;

        // GPU の更新
        if (data.gpu_active) {
            const gpuBar = document.getElementById('gpu-bar');
            gpuBar.style.width = `${data.gpu}%`;
            document.getElementById('gpu-text').innerText = `${data.gpu}%`;
            document.getElementById('gpu-temp-text').innerText = `${data.gpu_temp}°C`;

            // 温度が高い(80度以上)場合に赤く光らせる演出
            if (data.gpu_temp >= 80) {
                gpuBar.classList.add('warning-pulse');
            } else {
                gpuBar.classList.remove('warning-pulse');
            }
        }
    } catch (e) { console.error("Resource error:", e); }
}

async function updateTwitch() {
    try {
        const res = await fetch('/api/twitch/followed');
        const streams = await res.json();
        const listEl = document.getElementById('twitch-list');

        if (!Array.isArray(streams) || streams.length === 0) {
            listEl.innerHTML = '<p style="font-size:0.7rem; text-align:center; opacity:0.5;">ライブ中のフォローはいません</p>';
            return;
        }

        listEl.innerHTML = streams.map(stream => `
            <div class="twitch-item" onclick="window.open('https://twitch.tv/${stream.user_login}', '_blank')">
                <img class="twitch-avatar" src="${stream.thumbnail_url.replace('{width}', '50').replace('{height}', '50')}" alt="">
                <div class="twitch-info">
                    <span class="twitch-name">${stream.user_name}</span>
                    <span class="twitch-title">${stream.title}</span>
                </div>
                <div class="twitch-viewer">● ${stream.viewer_count.toLocaleString()}</div>
            </div>
        `).join('');
    } catch (e) { console.error("Twitch error:", e); }
}

// 5分ごとにチェック
setInterval(updateTwitch, 300000);
updateTwitch();

// 2秒ごとに更新
setInterval(updateResources, 1000);
updateResources();
// 15分ごとに自動更新
setInterval(updateCalendar, 900000);
updateCalendar();
// 15分おきに更新
setInterval(updateCalendar, 900000);
updateCalendar();
// 起動時に天気を取得し、30分ごとに更新
updateWeather();
setInterval(updateWeather, 1800000);