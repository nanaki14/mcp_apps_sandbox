import { useState } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import { surveyDataSchema, type ResponseItem, type SurveyData } from "./lib/schema";
import { SurveyForm } from "./components/SurveyForm";
import { ResultsDashboard } from "./components/ResultsDashboard";

export function App() {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "Survey App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (instance) => {
      instance.ontoolresult = (result) => {
        const text = result.content?.find((c) => c.type === "text")?.text;
        if (!text) return;
        try {
          const parsed = surveyDataSchema.parse(JSON.parse(text));
          setSurveyData(parsed);
        } catch {}
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
    try {
      const parsed = surveyDataSchema.parse(JSON.parse(text));
      setSurveyData(parsed);
      setSubmitted(true);
    } catch {}
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

  if (!isConnected || !surveyData) {
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {surveyData.survey.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {surveyData.survey.description}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SurveyForm
          survey={surveyData.survey}
          submitted={submitted}
          onSubmit={handleSubmit}
        />
        <ResultsDashboard
          survey={surveyData.survey}
          results={surveyData.results}
          totalResponses={surveyData.totalResponses}
        />
      </div>
    </div>
  );
}
