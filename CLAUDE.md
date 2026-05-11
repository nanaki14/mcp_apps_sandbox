# CLAUDE.md

## プロジェクト概要

MCP Apps を使ったサンプルアプリ。開発者向けアンケートフォームと集計ダッシュボードを Claude のチャット内にインタラクティブな UI として表示する。

## よく使うコマンド

```bash
pnpm build          # MCP UI + Web UI を両方ビルド
pnpm build:mcp      # MCP App のみ (dist/mcp-app.html)
pnpm build:web      # Web UI のみ (dist/web.html)
pnpm serve          # MCP サーバーを起動 (port 3001)
pnpm dev            # Web UI の watch ビルド + サーバー同時起動
pnpm lint           # oxlint でリント
pnpm format         # oxfmt でフォーマット
```

## アーキテクチャ

### サーバー (`server.ts`)

- Node.js の `http.createServer` で生サーバーを立て、`/mcp` エンドポイントは `StreamableHTTPServerTransport` に直接渡す
- Hono は `/health` などの補助ルートと `getRequestListener` 経由でのデリゲート用に使用
- Hono の Web API と MCP SDK の Node.js ベース Transport には互換性がないため、`/mcp` だけ raw Node.js で処理している

### UI (`src/`)

- `useApp` フック (`@modelcontextprotocol/ext-apps/react`) で MCP App の接続を管理
- `app.ontoolresult` で初回ツール結果（アンケートデータ）を受け取る
- `app.callServerTool` でフォーム送信時に `submit_response` を呼び出す
- Vite + `vite-plugin-singlefile` で全アセットを 1 つの HTML にバンドルして `dist/mcp-app.html` に出力

### 状態管理

サーバーはアンケートデータと集計結果をインメモリで保持する。サーバー再起動でリセットされる（永続化は未実装）。

## 主要ファイル

| ファイル | 役割 |
|---|---|
| `server.ts` | MCP サーバー + REST API (`/api/survey`, `/api/submit`) + Web UI 配信 |
| `mcp-app.html` | MCP App の Vite エントリーポイント |
| `web.html` | Web UI の Vite エントリーポイント |
| `src/App.tsx` | MCP 接続管理（`useApp` フック） |
| `src/WebApp.tsx` | Web UI（fetch ベース、MCP 不要） |
| `src/lib/schema.ts` | Zod スキーマ（Survey / FormValues / ResponseItem） |
| `src/components/SurveyForm.tsx` | Base UI RadioGroup/Checkbox + react-hook-form（両モード共通） |
| `src/components/ResultsDashboard.tsx` | バーチャート、星評価集計（両モード共通） |

## 依存関係の注意点

- `@base-ui-components/react` は `@base-ui/react` にリネームされた。インポートは `@base-ui/react/*` を使うこと
- `inputSchema` は JSON Schema ではなく **Zod raw shape** (`{ key: z.string() }` 形式) で渡すこと。`z.object({})` でラップしないこと
- Tailwind v4 は `tailwind.config.ts` が不要。`src/styles.css` の `@import "tailwindcss"` だけで動く

## テスト

README の「テスト方法」セクションを参照。curl で各エンドポイントを叩いて確認できる。
