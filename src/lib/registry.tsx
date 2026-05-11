import { useState } from "react";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { Checkbox } from "@base-ui/react/checkbox";
import { useActions, useBoundProp } from "@json-render/react";
import type { ComponentRegistry } from "@json-render/react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { calcPercentage } from "./utils";

const BAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-400",
  "bg-rose-500",
  "bg-cyan-500",
];

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span
            className={
              (hovered || value) >= star ? "text-amber-400" : "text-slate-200"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export const registry: ComponentRegistry = {
  TwoColumnLayout: ({ children }) => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>
  ),

  FormCard: ({ children }) => (
    <Card>
      <CardHeader>
        <CardTitle>📋 回答フォーム</CardTitle>
        <CardDescription>全ての質問にお答えください</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  ),

  RadioQuestion: ({ element, bindings }) => {
    const p = element.props as { label: string; options: string[]; value?: string };
    const [value, setValue] = useBoundProp<string>(p.value, bindings?.value);
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">{p.label}</p>
        <RadioGroup
          value={value ?? ""}
          onValueChange={setValue}
          className="space-y-1.5"
        >
          {p.options.map((opt) => (
            <Radio.Root
              key={opt}
              value={opt}
              className="group flex cursor-pointer items-center gap-2.5"
            >
              <div className="flex size-4 items-center justify-center rounded-full border border-slate-300 bg-white transition-colors group-data-[checked]:border-slate-900 group-data-[checked]:bg-slate-900">
                <Radio.Indicator className="size-1.5 rounded-full bg-white" />
              </div>
              <span className="text-sm text-slate-700">{opt}</span>
            </Radio.Root>
          ))}
        </RadioGroup>
      </div>
    );
  },

  CheckboxQuestion: ({ element, bindings }) => {
    const p = element.props as { label: string; options: string[]; value?: string[] };
    const [value, setValue] = useBoundProp<string[]>(p.value, bindings?.value);
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">{p.label}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {p.options.map((opt) => {
            const checked = (value ?? []).includes(opt);
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2.5"
              >
                <Checkbox.Root
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    setValue(
                      isChecked
                        ? [...(value ?? []), opt]
                        : (value ?? []).filter((v) => v !== opt),
                    );
                  }}
                  className="flex size-4 items-center justify-center rounded border border-slate-300 bg-white transition-colors data-[checked]:border-slate-900 data-[checked]:bg-slate-900"
                >
                  <Checkbox.Indicator className="text-white">
                    <svg
                      viewBox="0 0 12 12"
                      className="size-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm text-slate-700">{opt}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  },

  StarRatingQuestion: ({ element, bindings }) => {
    const p = element.props as { label: string; value?: number };
    const [value, setValue] = useBoundProp<number>(p.value, bindings?.value);
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">{p.label}</p>
        <StarInput value={value ?? 0} onChange={(v) => setValue(v)} />
      </div>
    );
  },

  TextQuestion: ({ element, bindings }) => {
    const p = element.props as { label: string; value?: string };
    const [value, setValue] = useBoundProp<string>(p.value, bindings?.value);
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">{p.label}</p>
        <textarea
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder="自由にご記入ください（任意）"
          className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
    );
  },

  SubmitButton: ({ element, emit }) => {
    const p = element.props as { label: string };
    const { loadingActions } = useActions();
    const isLoading = loadingActions.has("submitSurvey");
    return (
      <Button
        type="button"
        disabled={isLoading}
        className="w-full"
        onClick={() => emit("press")}
      >
        {isLoading ? "送信中..." : p.label}
      </Button>
    );
  },

  SuccessMessage: () => (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="text-5xl">🎉</span>
      <p className="font-medium text-slate-900">回答を送信しました</p>
      <p className="text-sm text-slate-500">
        右のダッシュボードで結果を確認できます
      </p>
    </div>
  ),

  ErrorMessage: ({ element }) => {
    const p = element.props as { message?: string };
    return <p className="text-xs text-red-500">{p.message}</p>;
  },

  ResultsCard: ({ element, children }) => {
    const p = element.props as { totalResponses: number };
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📊 集計結果</CardTitle>
            <Badge variant="secondary">{p.totalResponses}名が回答</Badge>
          </div>
          <CardDescription>
            {p.totalResponses === 0
              ? "まだ回答がありません"
              : "リアルタイムで更新されます"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    );
  },

  BarChart: ({ element }) => {
    const p = element.props as {
      label: string;
      answers: Record<string, number>;
      totalResponses: number;
    };
    const entries = Object.entries(p.answers).sort(([, a], [, b]) => b - a);
    return (
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-800">{p.label}</h4>
        {entries.length === 0 ? (
          <p className="text-xs text-slate-400">まだ回答がありません</p>
        ) : (
          <div className="space-y-2">
            {entries.map(([key, count], i) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{key}</span>
                  <span className="text-slate-500">
                    {count}票 ({calcPercentage(count, p.totalResponses)}%)
                  </span>
                </div>
                <Progress
                  value={calcPercentage(count, p.totalResponses)}
                  color={BAR_COLORS[i % BAR_COLORS.length]}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  },

  RatingResult: ({ element }) => {
    const p = element.props as {
      label: string;
      answers: Record<string, number>;
      totalResponses: number;
    };
    const entries = Object.entries(p.answers);

    if (entries.length === 0) {
      return (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">{p.label}</h4>
          <p className="text-xs text-slate-400">まだ回答がありません</p>
        </section>
      );
    }

    const total = entries.reduce((sum, [, c]) => sum + c, 0);
    const avg =
      entries.reduce((sum, [score, count]) => sum + Number(score) * count, 0) /
      total;

    return (
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-800">{p.label}</h4>
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
            const count = p.answers[String(star)] ?? 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-slate-500">{star}</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1">
                  <Progress
                    value={calcPercentage(count, p.totalResponses)}
                    color="bg-amber-400"
                  />
                </div>
                <span className="w-6 text-right text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </section>
    );
  },

  Divider: () => <div className="border-t border-slate-100" />,
};
