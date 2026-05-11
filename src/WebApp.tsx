import { useCallback, useEffect, useState } from "react";
import type { Spec } from "@json-render/react";
import type { ResponseItem } from "./lib/schema";
import { SurveyRenderer } from "./components/SurveyRenderer";

type Tab = "survey" | "dashboard";

async function fetchSpec(endpoint: string): Promise<Spec> {
  const r = await fetch(endpoint);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const { spec } = (await r.json()) as { spec: Spec };
  return spec;
}

export function WebApp() {
  const [tab, setTab] = useState<Tab>("survey");
  const [surveySpec, setSurveySpec] = useState<Spec | null>(null);
  const [dashboardSpec, setDashboardSpec] = useState<Spec | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpec("/api/survey")
      .then(setSurveySpec)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  }, []);

  useEffect(() => {
    if (tab !== "dashboard") return;
    fetchSpec("/api/dashboard")
      .then(setDashboardSpec)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  }, [tab]);

  const handleSubmit = useCallback(async (responses: ResponseItem[]) => {
    const r = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { spec } = (await r.json()) as { spec: Spec };
    setSurveySpec(spec);
    // Refresh dashboard if it was already loaded
    setDashboardSpec(null);
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">エラーが発生しました</p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const activeSpec = tab === "survey" ? surveySpec : dashboardSpec;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                開発者技術調査 2025
              </h1>
              <p className="text-xs text-slate-500">MCP Survey App — Web UI</p>
            </div>
            {/* Tab switcher */}
            <nav className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(["survey", "dashboard"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    tab === t
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                >
                  {t === "survey" ? "📋 アンケート" : "📊 ダッシュボード"}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {!activeSpec ? (
          <div className="flex justify-center py-24">
            <div className="text-center">
              <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              <p className="text-sm text-slate-500">読み込み中...</p>
            </div>
          </div>
        ) : (
          <SurveyRenderer
            key={tab}
            spec={activeSpec}
            onSubmit={tab === "survey" ? handleSubmit : undefined}
          />
        )}
      </main>
    </div>
  );
}
