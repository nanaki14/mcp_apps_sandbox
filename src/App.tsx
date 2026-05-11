import { useState } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { Spec } from "@json-render/react";
import type { ResponseItem } from "./lib/schema";
import { SurveyRenderer } from "./components/SurveyRenderer";

function parseSpec(toolResultText: string): Spec | null {
  try {
    const { spec } = JSON.parse(toolResultText) as { spec: Spec };
    return spec ?? null;
  } catch {
    return null;
  }
}

export function App() {
  const [spec, setSpec] = useState<Spec | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "Survey App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (instance) => {
      instance.ontoolresult = (result) => {
        const text = result.content?.find((c) => c.type === "text")?.text;
        if (!text) return;
        const parsed = parseSpec(text);
        if (parsed) setSpec(parsed);
      };
    },
  });

  const handleSubmit = async (responses: ResponseItem[]) => {
    if (!app) return;
    const result = await app.callServerTool({
      name: "submit_response",
      arguments: { responses },
    });
    const text = result.content?.find((c) => c.type === "text")?.text;
    if (!text) return;
    const parsed = parseSpec(text);
    if (parsed) setSpec(parsed);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">接続エラー</p>
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !spec) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-sm text-slate-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <SurveyRenderer spec={spec} onSubmit={handleSubmit} />
    </div>
  );
}
