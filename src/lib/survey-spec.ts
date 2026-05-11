import type { Spec } from "@json-render/react";

// ─── Shared data type (used by both client and server) ───────────────────────

export interface QuestionResult {
  questionId: string;
  answers: Record<string, number>;
}

export interface SurveySpecInput {
  survey: {
    questions: Array<{
      id: string;
      text: string;
      options?: string[];
    }>;
  };
  results: QuestionResult[];
  totalResponses: number;
}

// ─── Initial form state ───────────────────────────────────────────────────────

export const INITIAL_STATE = {
  form: {
    primary_lang: "",
    frameworks: [] as string[],
    satisfaction: 0,
    comment: "",
  },
  submitted: false,
  error: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAvgRating(answers: Record<string, number>): number {
  const entries = Object.entries(answers);
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  return (
    entries.reduce((sum, [score, count]) => sum + Number(score) * count, 0) /
    total
  );
}

function calcTopAnswer(answers: Record<string, number>): string {
  const entries = Object.entries(answers);
  if (entries.length === 0) return "—";
  return entries.sort(([, a], [, b]) => b - a)[0][0];
}

// ─── Survey spec (form + live results) ───────────────────────────────────────

const NOT_SUBMITTED = { $state: "/submitted", not: true as const };
const IS_SUBMITTED = { $state: "/submitted" };
const HAS_ERROR = { $state: "/error" };

export function buildSurveySpec(data: SurveySpecInput): Spec {
  const { survey, results, totalResponses } = data;

  const qLang = survey.questions.find((q) => q.id === "primary_lang");
  const qFw = survey.questions.find((q) => q.id === "frameworks");
  const qSat = survey.questions.find((q) => q.id === "satisfaction");
  const qCmt = survey.questions.find((q) => q.id === "comment");

  const rLang = results.find((r) => r.questionId === "primary_lang");
  const rFw = results.find((r) => r.questionId === "frameworks");
  const rSat = results.find((r) => r.questionId === "satisfaction");

  const formChildren: string[] = [
    qLang && "q-primary_lang",
    qFw && "q-frameworks",
    qSat && "q-satisfaction",
    qCmt && "q-comment",
    "error-msg",
    "submit-btn",
    "success",
  ].filter(Boolean) as string[];

  const resultsChildren: string[] = [
    rLang && "r-primary_lang",
    rLang && rFw && "divider-1",
    rFw && "r-frameworks",
    rFw && rSat && "divider-2",
    rSat && "r-satisfaction",
  ].filter(Boolean) as string[];

  return {
    root: "root",
    elements: {
      root: {
        type: "TwoColumnLayout",
        props: {},
        children: ["form-card", "results-card"],
      },
      "form-card": { type: "FormCard", props: {}, children: formChildren },
      ...(qLang && {
        "q-primary_lang": {
          type: "RadioQuestion",
          props: {
            label: qLang.text,
            options: qLang.options ?? [],
            value: { $bindState: "/form/primary_lang" },
          },
          visible: NOT_SUBMITTED,
        },
      }),
      ...(qFw && {
        "q-frameworks": {
          type: "CheckboxQuestion",
          props: {
            label: qFw.text,
            options: qFw.options ?? [],
            value: { $bindState: "/form/frameworks" },
          },
          visible: NOT_SUBMITTED,
        },
      }),
      ...(qSat && {
        "q-satisfaction": {
          type: "StarRatingQuestion",
          props: {
            label: qSat.text,
            value: { $bindState: "/form/satisfaction" },
          },
          visible: NOT_SUBMITTED,
        },
      }),
      ...(qCmt && {
        "q-comment": {
          type: "TextQuestion",
          props: {
            label: qCmt.text,
            value: { $bindState: "/form/comment" },
          },
          visible: NOT_SUBMITTED,
        },
      }),
      "error-msg": {
        type: "ErrorMessage",
        props: { message: { $state: "/error" } },
        visible: HAS_ERROR,
      },
      "submit-btn": {
        type: "SubmitButton",
        props: { label: "回答を送信する" },
        visible: NOT_SUBMITTED,
        on: {
          press: {
            action: "submitSurvey",
            params: {
              primary_lang: { $state: "/form/primary_lang" },
              frameworks: { $state: "/form/frameworks" },
              satisfaction: { $state: "/form/satisfaction" },
              comment: { $state: "/form/comment" },
            },
            onSuccess: { set: { "/submitted": true } },
            onError: { set: { "/error": "$error.message" } },
          },
        },
      },
      success: { type: "SuccessMessage", props: {}, visible: IS_SUBMITTED },
      "results-card": {
        type: "ResultsCard",
        props: { totalResponses },
        children: resultsChildren,
      },
      ...(rLang && {
        "r-primary_lang": {
          type: "BarChart",
          props: {
            label: qLang?.text ?? "",
            answers: rLang.answers,
            totalResponses,
          },
        },
      }),
      "divider-1": { type: "Divider", props: {} },
      ...(rFw && {
        "r-frameworks": {
          type: "BarChart",
          props: {
            label: qFw?.text ?? "",
            answers: rFw.answers,
            totalResponses,
          },
        },
      }),
      "divider-2": { type: "Divider", props: {} },
      ...(rSat && {
        "r-satisfaction": {
          type: "RatingResult",
          props: {
            label: qSat?.text ?? "",
            answers: rSat.answers,
            totalResponses,
          },
        },
      }),
    },
  } as unknown as Spec;
}

// ─── Dashboard spec (analytics-only, no form) ─────────────────────────────────

export function buildDashboardSpec(data: SurveySpecInput): Spec {
  const { survey, results, totalResponses } = data;

  const qLang = survey.questions.find((q) => q.id === "primary_lang");
  const qFw = survey.questions.find((q) => q.id === "frameworks");
  const qSat = survey.questions.find((q) => q.id === "satisfaction");

  const rLang = results.find((r) => r.questionId === "primary_lang");
  const rFw = results.find((r) => r.questionId === "frameworks");
  const rSat = results.find((r) => r.questionId === "satisfaction");

  const avgRating = rSat ? calcAvgRating(rSat.answers) : 0;
  const topLang = rLang ? calcTopAnswer(rLang.answers) : "—";

  const chartsChildren: string[] = [
    rLang && "chart-lang",
    rLang && rFw && "divider-charts-1",
    rFw && "chart-fw",
    (rFw || rLang) && rSat && "divider-charts-2",
    rSat && "chart-rating",
  ].filter(Boolean) as string[];

  return {
    root: "root",
    elements: {
      root: {
        type: "DashboardLayout",
        props: {},
        children: ["metrics", "charts"],
      },
      metrics: {
        type: "MetricsRow",
        props: {},
        children: ["m-responses", "m-rating", "m-top-lang"],
      },
      "m-responses": {
        type: "MetricCard",
        props: { label: "総回答数", value: totalResponses, unit: "件" },
      },
      "m-rating": {
        type: "MetricCard",
        props: {
          label: "平均満足度",
          value:
            totalResponses > 0 && avgRating > 0
              ? avgRating.toFixed(1)
              : "—",
          unit: totalResponses > 0 && avgRating > 0 ? "/ 5" : "",
        },
      },
      "m-top-lang": {
        type: "MetricCard",
        props: { label: "人気言語 #1", value: topLang },
      },
      charts: {
        type: "ChartsSection",
        props: {},
        children: chartsChildren,
      },
      ...(rLang && {
        "chart-lang": {
          type: "BarChart",
          props: {
            label: qLang?.text ?? "プログラミング言語",
            answers: rLang.answers,
            totalResponses,
          },
        },
      }),
      "divider-charts-1": { type: "Divider", props: {} },
      ...(rFw && {
        "chart-fw": {
          type: "BarChart",
          props: {
            label: qFw?.text ?? "フレームワーク",
            answers: rFw.answers,
            totalResponses,
          },
        },
      }),
      "divider-charts-2": { type: "Divider", props: {} },
      ...(rSat && {
        "chart-rating": {
          type: "RatingResult",
          props: {
            label: qSat?.text ?? "満足度",
            answers: rSat.answers,
            totalResponses,
          },
        },
      }),
    },
  } as unknown as Spec;
}
