import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { Hono } from "hono";
import { getRequestListener } from "@hono/node-server";
import {
  buildSurveySpec,
  buildDashboardSpec,
  ALL_DASHBOARD_SECTIONS,
  type DashboardSection,
} from "./src/lib/survey-spec.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Survey data ────────────────────────────────────────────────────────────

const survey = {
  id: "dev-survey-2025",
  title: "開発者技術調査 2025",
  description:
    "現代のWeb開発における技術スタックと開発体験についてのアンケートです",
  questions: [
    {
      id: "primary_lang",
      text: "メインで使用しているプログラミング言語は？",
      type: "radio" as const,
      options: ["TypeScript", "Python", "Go", "Rust", "Java", "その他"],
    },
    {
      id: "frameworks",
      text: "使用しているフロントエンドフレームワーク（複数選択可）",
      type: "checkbox" as const,
      options: ["React", "Vue", "Svelte", "Angular", "Solid", "Astro"],
    },
    {
      id: "satisfaction",
      text: "現在のAI開発ツールへの満足度（1〜5）",
      type: "rating" as const,
      max: 5,
    },
    {
      id: "comment",
      text: "MCP Appsについての感想（自由記述）",
      type: "text" as const,
    },
  ],
};

interface QuestionResult {
  questionId: string;
  answers: Record<string, number>;
}

const results: QuestionResult[] = survey.questions.map((q) => ({
  questionId: q.id,
  answers: {},
}));

let totalResponses = 0;

const toSurveySpecPayload = () =>
  JSON.stringify({ spec: buildSurveySpec({ survey, results, totalResponses }) });

const toDashboardSpecPayload = (sections?: DashboardSection[]) =>
  JSON.stringify({ spec: buildDashboardSpec({ survey, results, totalResponses }, sections) });

// ─── MCP Server ──────────────────────────────────────────────────────────────

const resourceUri = "ui://survey/mcp-app.html";

const mcpServer = new McpServer({
  name: "MCP Survey App",
  version: "1.0.0",
});

registerAppTool(
  mcpServer,
  "show_survey",
  {
    title: "アンケートを表示",
    description:
      "開発者向けアンケートフォームと集計ダッシュボードをインタラクティブなUIで表示します。",
    _meta: { ui: { resourceUri } },
  },
  async () => ({
    content: [{ type: "text", text: toSurveySpecPayload() }],
  }),
);

registerAppTool(
  mcpServer,
  "show_dashboard",
  {
    title: "ダッシュボードを表示",
    description:
      "回答データのアナリティクスダッシュボードを表示します。sections で表示するセクションを絞り込めます（metrics: 集計カード、lang: 言語チャート、frameworks: FWチャート、rating: 満足度チャート）。",
    inputSchema: {
      sections: z
        .array(z.enum(["metrics", "lang", "frameworks", "rating"]))
        .optional()
        .describe("表示するセクション。省略時は全セクション表示"),
    },
    _meta: { ui: { resourceUri } },
  },
  async ({ sections }: { sections?: DashboardSection[] }) => ({
    content: [{ type: "text", text: toDashboardSpecPayload(sections) }],
  }),
);

registerAppTool(
  mcpServer,
  "submit_response",
  {
    title: "回答を送信",
    description: "アンケートへの回答を送信して集計結果を更新します。",
    inputSchema: {
      responses: z.array(
        z.object({
          questionId: z.string(),
          answer: z.union([z.string(), z.array(z.string())]),
        }),
      ),
    },
    _meta: { ui: { resourceUri } },
  },
  async ({ responses }: { responses: Array<{ questionId: string; answer: string | string[] }> }) => {
    for (const response of responses) {
      const result = results.find((r) => r.questionId === response.questionId);
      if (!result) continue;
      const answers = Array.isArray(response.answer)
        ? response.answer
        : [response.answer];
      for (const answer of answers) {
        if (!answer) continue;
        result.answers[answer] = (result.answers[answer] ?? 0) + 1;
      }
    }
    totalResponses++;
    return { content: [{ type: "text", text: toSurveySpecPayload() }] };
  },
);

registerAppResource(
  mcpServer,
  "Survey UI",
  resourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    const html = await fs.readFile(
      path.join(__dirname, "dist", "mcp-app.html"),
      "utf-8",
    );
    return {
      contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
    };
  },
);

// ─── HTTP Server (Hono for non-MCP routes + raw Node.js for MCP) ─────────────

const honoApp = new Hono();

honoApp.get("/health", (c) => c.json({ status: "ok", totalResponses }));

honoApp.get("/api/survey", (c) =>
  c.json({ spec: buildSurveySpec({ survey, results, totalResponses }) }),
);

honoApp.get("/api/dashboard", (c) => {
  const raw = c.req.query("sections");
  const sections = raw
    ? (raw.split(",").filter((s) =>
        ALL_DASHBOARD_SECTIONS.includes(s as DashboardSection),
      ) as DashboardSection[])
    : undefined;
  return c.json({ spec: buildDashboardSpec({ survey, results, totalResponses }, sections) });
});

honoApp.post("/api/submit", async (c) => {
  const { responses } = await c.req.json<{
    responses: Array<{ questionId: string; answer: string | string[] }>;
  }>();
  for (const response of responses) {
    const result = results.find((r) => r.questionId === response.questionId);
    if (!result) continue;
    const answers = Array.isArray(response.answer)
      ? response.answer
      : [response.answer];
    for (const answer of answers) {
      if (!answer) continue;
      result.answers[answer] = (result.answers[answer] ?? 0) + 1;
    }
  }
  totalResponses++;
  return c.json({ spec: buildSurveySpec({ survey, results, totalResponses }) });
});

honoApp.get("/", async (c) => {
  const html = await fs.readFile(
    path.join(__dirname, "dist", "web.html"),
    "utf-8",
  );
  return c.html(html);
});

const honoListener = getRequestListener(honoApp.fetch);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id",
};

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}

const server = http.createServer(async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/mcp") {
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }

    const body = await readBody(req);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => transport.close());
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, body);
    return;
  }

  await honoListener(req, res);
});

const PORT = Number(process.env.PORT ?? 3001);
server.listen(PORT, () => {
  console.log(`MCP Server: http://localhost:${PORT}/mcp`);
  console.log(`Health:     http://localhost:${PORT}/health`);
});
