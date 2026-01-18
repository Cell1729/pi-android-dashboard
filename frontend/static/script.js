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