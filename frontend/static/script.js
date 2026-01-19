// 再生状態の管理
let isPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
    // 初回実行
    updateAll();

    // タイマーを一箇所で管理（重複を排除）
    setInterval(updateClock, 1000);      // 1秒ごと
    setInterval(updateResources, 2000);  // 2秒ごと
    setInterval(updateSpotify, 5000);    // 5秒ごと
    setInterval(updateTwitch, 60000);    // 1分ごと
    setInterval(updateCalendar, 900000);  // 15分ごと
    setInterval(updateWeather, 1800000); // 30分ごと
});

// 全情報を一斉更新する関数
async function updateAll() {
    updateClock();
    updateSpotify();
    updateWeather();
    updateCalendar();
    updateResources();
    updateTwitch();
}

/**
 * Spotify 関連
 */
async function updateSpotify() {
    try {
        // 曲情報とデバイス一覧を同時に取得
        const [currRes, devRes] = await Promise.all([
            fetch('/api/spotify/current'),
            fetch('/api/spotify/devices')
        ]);
        
        const data = await currRes.json();
        const devices = await devRes.json();
        
        const imgEl = document.getElementById('album-art');
        const titleEl = document.getElementById('track-title');
        const artistEl = document.getElementById('track-artist');
        const deviceEl = document.getElementById('device-info');
        const listEl = document.getElementById('device-list');
        const btnEl = document.getElementById('play-pause-btn');
        
        if (!imgEl || !titleEl) return;

        const NO_TRACK_IMAGE = "/static/image/no_track.jpg";
        const activeDev = devices.find(d => d.is_active);

        // --- 曲情報の表示更新 ---
        if (data.is_playing && data.image_url) {
            isPlaying = true;
            titleEl.innerText = data.title;
            if (artistEl) artistEl.innerText = data.artist;
            imgEl.src = data.image_url;
            if (btnEl) btnEl.innerText = '||';
            if (deviceEl) deviceEl.innerText = activeDev ? `🎧 ${activeDev.name.toUpperCase()}` : "🎧 SELECT DEVICE";
        } else {
            isPlaying = false;
            titleEl.innerText = "Spotify 停止中";
            if (artistEl) artistEl.innerText = "曲を選択してください";
            imgEl.src = NO_TRACK_IMAGE;
            if (btnEl) btnEl.innerText = '▶';
            if (deviceEl) deviceEl.innerText = "🎧 STOPPED";
        }

        // --- デバイス一覧（ポップアップ）の更新 ---
        if (listEl) {
            listEl.innerHTML = devices.map(d => `
                <div class="device-item ${d.is_active ? 'active' : ''}" onclick="switchDevice('${d.id}')">
                    <span>${d.name}</span>
                    <span>${d.is_active ? '●' : ''}</span>
                </div>
            `).join('');
        }

    } catch (e) {
        console.error("Spotify update error:", e);
    }
}

// 操作系
async function controlSpotify(action) {
    await fetch(`/api/spotify/${action}`);
    setTimeout(updateSpotify, 500);
}

async function togglePlay() {
    await fetch('/api/spotify/toggle');
    setTimeout(updateSpotify, 500);
}

async function setVolume(val) {
    await fetch(`/api/spotify/volume?value=${val}`);
}

// デバイス切り替え
function toggleDeviceList() {
    const list = document.getElementById('device-list');
    if (list) list.style.display = list.style.display === 'block' ? 'none' : 'block';
}

async function switchDevice(deviceId) {
    await fetch(`/api/spotify/transfer/${deviceId}`);
    const list = document.getElementById('device-list');
    if (list) list.style.display = 'none';
    setTimeout(updateSpotify, 500);
}

// ポップアップ以外をクリックで閉じる
window.addEventListener('click', (e) => {
    if (!e.target.closest('.device-selector-container')) {
        const list = document.getElementById('device-list');
        if (list) list.style.display = 'none';
    }
});

/**
 * 時計
 */
function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('ja-JP');
    }
}

/**
 * 天気
 */
async function updateWeather() {
    try {
        const response = await fetch('/api/weather');
        const data = await response.json();
        const curr = data.current;

        document.getElementById('temp-curr').innerText = Math.round(curr.temp);
        document.getElementById('pressure').innerText = curr.pressure;
        document.getElementById('humidity').innerText = curr.humidity;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${curr.icon}@2x.png`;

        const forecastList = document.getElementById('forecast-list');
        forecastList.innerHTML = data.forecast.map(item => {
            const time = new Date(item.dt * 1000).getHours();
            const temp = Math.round(item.main.temp);
            const icon = item.weather[0].icon;
            return `
                <div class="forecast-item">
                    <div class="f-time">${time}:00</div>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
                    <div class="f-temp">${temp}°C</div>
                </div>
            `;
        }).join('');
    } catch (e) { console.error("Weather error:", e); }
}

/**
 * カレンダー
 */
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
            const timeStr = event.start.dateTime 
                ? start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) 
                : "終日";

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
    } catch (e) { console.error("Calendar update error:", e); }
}

/**
 * PCリソース
 */
async function updateResources() {
    try {
        const res = await fetch('/api/resources');
        const data = await res.json();
        
        document.getElementById('cpu-bar').style.width = `${data.cpu}%`;
        document.getElementById('cpu-text').innerText = `${Math.round(data.cpu)}%`;
        document.getElementById('ram-bar').style.width = `${data.ram}%`;
        document.getElementById('ram-text').innerText = `${Math.round(data.ram)}%`;

        if (data.gpu_active) {
            const gpuBar = document.getElementById('gpu-bar');
            gpuBar.style.width = `${data.gpu}%`;
            document.getElementById('gpu-text').innerText = `${data.gpu}%`;
            document.getElementById('gpu-temp-text').innerText = `${data.gpu_temp}°C`;

            if (data.gpu_temp >= 80) gpuBar.classList.add('warning-pulse');
            else gpuBar.classList.remove('warning-pulse');
        }
    } catch (e) { console.error("Resource error:", e); }
}

/**
 * Twitch
 */
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