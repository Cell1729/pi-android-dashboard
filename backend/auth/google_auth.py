import os
from google_auth_oauthlib.flow import InstalledAppFlow

# スコープの設定
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'credential.json')

def get_token():
    print(f"Searching for credentials at: {CREDENTIALS_FILE}")
    
    # クライアント情報の読み込み
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    print("Successfully loaded client secrets.")

    # ブラウザを開く (open_browser=False にするとURLがコンソールに出る)
    # 念のため open_browser=True (デフォルト) で実行しつつ、URLも表示させる
    creds = flow.run_local_server(port=0, open_browser=True)

    # トークンの保存
    token_path = os.path.join(BASE_DIR, 'token.json')
    with open(token_path, 'w') as token:
        token.write(creds.to_json())
    print(f"Successfully created: {token_path}")

if __name__ == "__main__":
    get_token()