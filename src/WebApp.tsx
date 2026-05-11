import { useEffect, useState } from "react";
import { surveyDataSchema, type ResponseItem, type SurveyData } from "./lib/schema";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { SurveyForm } from "./components/SurveyForm";

export function WebApp() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/survey")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setData(surveyDataSchema.parse(json)))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  }, []);

  const handleSubmit = async (responses: ResponseItem[]) => {
    const r = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();
    setData(surveyDataSchema.parse(json));
    setSubmitted(true);
  };

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

  if (!data) {
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
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {data.survey.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.survey.description}
          </p>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          Web UI
        </span>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SurveyForm
          survey={data.survey}
          submitted={submitted}
          onSubmit={handleSubmit}
        />
        <ResultsDashboard
          survey={data.survey}
          results={data.results}
          totalResponses={data.totalResponses}
        />
      </div>
    </div>
  );
}
