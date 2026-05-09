import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { calcPercentage } from "../lib/utils";
import type { QuestionResult, Survey } from "../lib/schema";

const BAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

interface ResultsDashboardProps {
  survey: Survey;
  results: QuestionResult[];
  totalResponses: number;
}

function BarChart({
  questionId,
  results,
  totalResponses,
}: {
  questionId: string;
  results: QuestionResult[];
  totalResponses: number;
}) {
  const result = results.find((r) => r.questionId === questionId);
  if (!result) return null;

  const entries = Object.entries(result.answers).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    return (
      <p className="text-xs text-slate-400">まだ回答がありません</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([label, count], i) => (
        <div key={label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{label}</span>
            <span className="text-slate-500">
              {count}票 ({calcPercentage(count, totalResponses)}%)
            </span>
          </div>
          <Progress
            value={calcPercentage(count, totalResponses)}
            color={BAR_COLORS[i % BAR_COLORS.length]}
          />
        </div>
      ))}
    </div>
  );
}

function RatingDisplay({
  questionId,
  results,
  totalResponses,
}: {
  questionId: string;
  results: QuestionResult[];
  totalResponses: number;
}) {
  const result = results.find((r) => r.questionId === questionId);
  if (!result) return null;

  const entries = Object.entries(result.answers);
  if (entries.length === 0) {
    return <p className="text-xs text-slate-400">まだ回答がありません</p>;
  }

  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  const avg =
    entries.reduce((sum, [score, count]) => sum + Number(score) * count, 0) /
    total;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-slate-900">
          {avg.toFixed(1)}
        </span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={avg >= star ? "text-amber-400" : "text-slate-200"}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-sm text-slate-500">/ 5</span>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = result.answers[String(star)] ?? 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-slate-500">{star}</span>
              <span className="text-amber-400">★</span>
              <div className="flex-1">
                <Progress
                  value={calcPercentage(count, totalResponses)}
                  color="bg-amber-400"
                />
              </div>
              <span className="w-6 text-right text-slate-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResultsDashboard({
  survey,
  results,
  totalResponses,
}: ResultsDashboardProps) {
  const primaryLangQ = survey.questions.find((q) => q.id === "primary_lang");
  const frameworksQ = survey.questions.find((q) => q.id === "frameworks");
  const satisfactionQ = survey.questions.find((q) => q.id === "satisfaction");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📊 集計結果</CardTitle>
          <Badge variant="secondary">
            {totalResponses}名が回答
          </Badge>
        </div>
        <CardDescription>
          {totalResponses === 0
            ? "まだ回答がありません"
            : "リアルタイムで更新されます"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {primaryLangQ && (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-800">
              {primaryLangQ.text}
            </h4>
            <BarChart
              questionId="primary_lang"
              results={results}
              totalResponses={totalResponses}
            />
          </section>
        )}

        <div className="border-t border-slate-100" />

        {frameworksQ && (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-800">
              {frameworksQ.text}
            </h4>
            <BarChart
              questionId="frameworks"
              results={results}
              totalResponses={totalResponses}
            />
          </section>
        )}

        <div className="border-t border-slate-100" />

        {satisfactionQ && (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-800">
              {satisfactionQ.text}
            </h4>
            <RatingDisplay
              questionId="satisfaction"
              results={results}
              totalResponses={totalResponses}
            />
          </section>
        )}
      </CardContent>
    </Card>
  );
}
