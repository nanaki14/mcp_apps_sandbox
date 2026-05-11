# MCP Survey App

MCP Apps を使ってチャット内にインタラクティブな UI を表示するサンプルアプリです。  
開発者向けアンケートフォームと集計ダッシュボードをリアルタイムで表示します。

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| ビルド | Vite 6 + vite-plugin-singlefile |
| UI フレームワーク | React 19 |
| スタイリング | Tailwind CSS v4 |
| UI プリミティブ | Base UI (`@base-ui/react`) |
| フォーム | react-hook-form + zod |
| MCP サーバー | @modelcontextprotocol/sdk + @modelcontextprotocol/ext-apps |
| HTTP サーバー | Hono + Node.js http |
| リント | oxlint |
| フォーマット | oxfmt |

## プロジェクト構成

```
├── server.ts              # MCP サーバー (Hono + Node.js http)
├── mcp-app.html           # MCP App の Vite エントリーポイント
├── web.html               # Web UI の Vite エントリーポイント
├── vite.config.ts
├── tsconfig.json
├── .oxlintrc.json
└── src/
    ├── mcp-app.tsx        # MCP App エントリーポイント
    ├── web-app.tsx        # Web UI エントリーポイント
    ├── styles.css         # Tailwind v4
    ├── App.tsx            # MCP 接続管理 (useApp フック)
    ├── WebApp.tsx         # スタンドアロン Web UI (fetch ベース)
    ├── lib/
    │   ├── schema.ts      # Zod スキーマ定義
    │   └── utils.ts
    └── components/
        ├── SurveyForm.tsx        # フォーム (Base UI RadioGroup/Checkbox + 星評価)
        ├── ResultsDashboard.tsx  # 集計ダッシュボード (バーチャート)
        └── ui/
            ├── button.tsx
            ├── card.tsx
            ├── badge.tsx
            └── progress.tsx
```

## 2 つの UI モード

| モード | URL | 説明 |
|---|---|---|
| **Web UI** | `http://localhost:3001/` | ブラウザから直接アクセスできるスタンドアロン版 |
| **MCP App** | Claude 経由 | チャット内に埋め込まれるインタラクティブ版 |

Web UI は REST API (`/api/survey`, `/api/submit`) で動作し、MCP は不要です。  
`SurveyForm` / `ResultsDashboard` コンポーネントは両モードで共用しています。

## MCP ツール

| ツール名 | 説明 |
|---|---|
| `show_survey` | アンケートフォームと集計ダッシュボードを表示 |
| `submit_response` | 回答を送信して集計結果をリアルタイム更新 |

## セットアップ

```bash
pnpm install
pnpm build        # MCP UI + Web UI を両方ビルド
```

個別にビルドする場合:

```bash
pnpm build:mcp    # MCP App のみ → dist/mcp-app.html
pnpm build:web    # Web UI のみ  → dist/web.html
```

## 起動

```bash
pnpm serve
# → http://localhost:3001/      (Web UI)
# → http://localhost:3001/mcp   (MCP エンドポイント)
```

Web UI の開発中は watch ビルド + サーバー同時起動が便利です:

```bash
pnpm dev
```

## テスト方法

### 1. Web UI をブラウザで確認

```bash
pnpm build && pnpm serve
# → http://localhost:3001/ をブラウザで開く
```

または REST API を直接叩く:

```bash
# アンケートデータ取得
curl http://localhost:3001/api/survey | jq .

# 回答を送信
curl -s -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "responses":[
      {"questionId":"primary_lang","answer":"TypeScript"},
      {"questionId":"frameworks","answer":["React","Hono"]},
      {"questionId":"satisfaction","answer":"5"}
    ]
  }' | jq '.totalResponses'
```

### 2. ローカルで MCP エンドポイントを確認

```bash
# ヘルスチェック
curl http://localhost:3001/health

# ツール一覧を取得
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq .

# アンケートデータを取得
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"show_survey","arguments":{}}}' | jq .
```

### 3. basic-host でローカル確認（Claude 不要）

[ext-apps の basic-host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host) を使うと、Claude なしでブラウザ上で MCP App UI をレンダリングできます。

```bash
git clone https://github.com/modelcontextprotocol/ext-apps.git
cd ext-apps/examples/basic-host
npm install
SERVERS='["http://localhost:3001/mcp"]' npm start
# → http://localhost:8080 を開いて show_survey を呼び出す
```

### 4. Claude Desktop で確認

ローカルサーバーをインターネットに公開してから接続します。

```bash
# cloudflared でトンネルを作成
npx cloudflared tunnel --url http://localhost:3001
# → https://xxxxx.trycloudflare.com が発行される
```

`~/.claude/claude_desktop_config.json` に以下を追加:

```json
{
  "mcpServers": {
    "mcp-survey-app": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://xxxxx.trycloudflare.com/mcp"
      ]
    }
  }
}
```

> **Note:** Claude Desktop の `mcpServers` は stdio ベースのサーバーのみ受け付けます。  
> `mcp-remote` が HTTP ↔ stdio のブリッジとして機能するため、`url` を直接指定する形式は使えません。

Claude Desktop を再起動後、「アンケートを表示して」と話しかけると UI が表示されます。

### 5. Claude.ai で確認

設定 → コネクター → カスタムコネクターを追加 → トンネル URL の末尾に `/mcp` を付けて登録。  
（有料プランが必要です）

## lint / format

```bash
pnpm lint      # oxlint
pnpm format    # oxfmt
```
