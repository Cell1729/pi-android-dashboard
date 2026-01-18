// 再生状態の管理
let isPlaying = false;

// 時計
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('ja-JP');
}
setInterval(updateClock, 1000);
updateClock();

// Spotify 状態更新
async function updateSpotify() {
    try {
        const response = await fetch('/api/spotify/current');
        const data = await response.json();
        const titleEl = document.getElementById('track-title');
        const artistEl = document.getElementById('track-artist');
        const imgEl = document.getElementById('album-art');
        const btnEl = document.getElementById('play-pause-btn');

        if (data.is_playing) {
            isPlaying = true;
            titleEl.innerText = data.title;
            artistEl.innerText = data.artist;
            imgEl.src = data.image_url;
            imgEl.style.display = 'block';
            btnEl.innerText = '||';
        } else {
            isPlaying = false;
            titleEl.innerText = "Spotify";
            artistEl.innerText = "停止中";
            imgEl.style.display = 'none';
            btnEl.innerText = '▶';
        }
    } catch (e) {}
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

// 音量（バックエンド未実装の場合はログ出力のみ）
function setVolume(val) {
    console.log("Volume set to:", val);
    // fetch(`/api/spotify/volume?value=${val}`);
}