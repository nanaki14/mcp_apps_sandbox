# MCP Survey App

MCP Apps を使ってチャット内にインタラクティブな UI を表示するサンプルアプリです。  
**json-render** でコンポーネントカタログを定義し、サーバーが状況に応じた UI スペックを返す「サーバードリブン UI」のデモです。

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| ビルド | Vite 6 + vite-plugin-singlefile |
| UI フレームワーク | React 19 |
| スタイリング | Tailwind CSS v4 |
| UI プリミティブ | Base UI (`@base-ui/react`) |
| **サーバードリブン UI** | **json-render (`@json-render/core` + `@json-render/react`)** |
| MCP サーバー | @modelcontextprotocol/sdk + @modelcontextprotocol/ext-apps |
| HTTP サーバー | Hono + Node.js http |
| リント | oxlint |
| フォーマット | oxfmt |

## アーキテクチャ概要

### サーバードリブン UI

このアプリは **json-render** を使ったサーバードリブン UI パターンを実装しています。

```
サーバー                              クライアント
────────────────────────────────      ────────────────────────────
show_survey ──► buildSurveySpec()  ──► { spec } ──► <Renderer />
show_dashboard ► buildDashboardSpec() ─► { spec } ──► <Renderer />
```

- **サーバー**：UI スペック（フラットな要素ツリー）を組み立てて返す
- **クライアント**：受け取った `spec` を `registry` のコンポーネントでレンダリングするだけ
- **同じレジストリ、異なるスペック** → まったく異なる UI を表示できる

### コンポーネントレジストリ (`src/lib/registry.tsx`)

```
共通コンポーネント
  TwoColumnLayout  FormCard  RadioQuestion  CheckboxQuestion
  StarRatingQuestion  TextQuestion  SubmitButton  SuccessMessage
  ErrorMessage  ResultsCard  BarChart  RatingResult  Divider

ダッシュボード専用
  DashboardLayout  MetricsRow  MetricCard  ChartsSection
```

### スペックビルダー (`src/lib/survey-spec.ts`)

| 関数 | 生成する UI |
|---|---|
| `buildSurveySpec()` | アンケートフォーム（フォーム + リアルタイム集計）|
| `buildDashboardSpec()` | アナリティクスダッシュボード（メトリクスカード + チャート）|

### UI の状態管理

フォーム入力値は json-render の `StateProvider` が管理します。

- `$bindState` → フォームフィールドの双方向バインディング
- `on.press` アクションバインディング → フォーム送信
- `onSuccess: { set: { "/submitted": true } }` → 送信後に成功状態へ遷移

### HTTP サーバー (`server.ts`)

- `/mcp` は `StreamableHTTPServerTransport` に直接渡す（raw Node.js）
- 他のルートは Hono + `getRequestListener` でデリゲート
- Hono の Web API と MCP SDK の Node.js ベース Transport に互換性がないため、`/mcp` だけ raw Node.js で処理

## プロジェクト構成

```
├── server.ts              # MCP サーバー + REST API
├── mcp-app.html           # MCP App の Vite エントリーポイント
├── web.html               # Web UI の Vite エントリーポイント
├── vite.config.ts
└── src/
    ├── mcp-app.tsx        # MCP App エントリーポイント
    ├── web-app.tsx        # Web UI エントリーポイント
    ├── styles.css
    ├── App.tsx            # MCP 接続管理（spec を受け取り描画）
    ├── WebApp.tsx         # Web UI（タブ切り替え・fetch ベース）
    ├── components/
    │   ├── SurveyRenderer.tsx   # JSONUIProvider + Renderer ラッパー
    │   └── ui/                  # 汎用 UI プリミティブ
    └── lib/
        ├── survey-spec.ts       # スペックビルダー（survey / dashboard）
        ├── registry.tsx         # コンポーネントレジストリ
        ├── schema.ts            # Zod スキーマ（ResponseItem のみ）
        └── utils.ts
```

## 2 つの UI モード

| モード | URL / 呼び出し方 | 説明 |
|---|---|---|
| **Web UI** | `http://localhost:3001/` | ブラウザから直接アクセス。タブで survey / dashboard を切り替え |
| **MCP App** | Claude 経由 | チャット内に埋め込まれるインタラクティブ版 |

## MCP ツール

| ツール名 | 説明 | 返す spec |
|---|---|---|
| `show_survey` | アンケートフォームと集計ダッシュボードを表示 | `TwoColumnLayout` ベース |
| `show_dashboard` | アナリティクスダッシュボードを表示 | `DashboardLayout` + `MetricCard` |
| `submit_response` | 回答を送信して集計結果をリアルタイム更新 | 更新後の survey spec |

## セットアップ

```bash
pnpm install
pnpm build        # MCP UI + Web UI を両方ビルド
```

## 起動

```bash
pnpm serve
# → http://localhost:3001/      (Web UI — タブで survey/dashboard 切り替え)
# → http://localhost:3001/mcp   (MCP エンドポイント)
```

開発中は watch ビルド + サーバー同時起動:

```bash
pnpm dev
```

## テスト方法

### 1. Web UI をブラウザで確認

```bash
pnpm build && pnpm serve
# → http://localhost:3001/ をブラウザで開く
# → 「📋 アンケート」「📊 ダッシュボード」タブを切り替えて確認
```

### 2. REST API で各スペックを確認

```bash
# アンケートスペック取得（フォーム + 集計）
curl http://localhost:3001/api/survey | jq '.spec.root'

# ダッシュボードスペック取得（メトリクス + チャート）
curl http://localhost:3001/api/dashboard | jq '.spec.elements | keys'

# 回答を送信（スペックが更新されて返る）
curl -s -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "responses":[
      {"questionId":"primary_lang","answer":"TypeScript"},
      {"questionId":"frameworks","answer":["React","Hono"]},
      {"questionId":"satisfaction","answer":"5"}
    ]
  }' | jq '.spec.elements["results-card"].props.totalResponses'
```

### 3. MCP ツールを curl で確認

```bash
# ヘルスチェック
curl http://localhost:3001/health

# ツール一覧
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | jq '[.result.tools[].name]'

# show_survey — アンケートスペックを取得
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"show_survey","arguments":{}}}' \
  | jq '.result.content[0].text | fromjson | .spec.root'

# show_dashboard — ダッシュボードスペックを取得
curl -s -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"show_dashboard","arguments":{}}}' \
  | jq '.result.content[0].text | fromjson | .spec.elements | keys'
```

### 4. basic-host でローカル確認（Claude 不要）

[ext-apps の basic-host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host) を使うと、Claude なしでブラウザ上で MCP App UI をレンダリングできます。

```bash
git clone https://github.com/modelcontextprotocol/ext-apps.git
cd ext-apps/examples/basic-host
npm install
SERVERS='["http://localhost:3001/mcp"]' npm start
# → http://localhost:8080 を開いて show_survey / show_dashboard を呼び出す
```

### 5. Claude Desktop で確認

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
> `mcp-remote` が HTTP ↔ stdio のブリッジとして機能します。

Claude Desktop を再起動後、「アンケートを表示して」「ダッシュボードを表示して」と話しかけると UI が表示されます。

### 6. Claude.ai で確認

設定 → コネクター → カスタムコネクターを追加 → トンネル URL の末尾に `/mcp` を付けて登録。  
（有料プランが必要です）

## lint / format

```bash
pnpm lint      # oxlint
pnpm format    # oxfmt
```
