import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { Checkbox } from "@base-ui/react/checkbox";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formValuesSchema, type FormValues, type ResponseItem, type Survey } from "../lib/schema";
import { cn } from "../lib/utils";

interface SurveyFormProps {
  survey: Survey;
  submitted: boolean;
  onSubmit: (responses: ResponseItem[]) => Promise<void>;
}

function StarRating({
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
          aria-label={`${star}点`}
        >
          <span
            className={cn(
              (hovered || value) >= star
                ? "text-amber-400"
                : "text-slate-200",
            )}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export function SurveyForm({ survey, submitted, onSubmit }: SurveyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formValuesSchema),
    defaultValues: {
      frameworks: [],
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const responses: ResponseItem[] = [
      { questionId: "primary_lang", answer: values.primary_lang },
      { questionId: "frameworks", answer: values.frameworks },
      { questionId: "satisfaction", answer: String(values.satisfaction) },
      { questionId: "comment", answer: values.comment ?? "" },
    ];
    await onSubmit(responses);
    setIsSubmitting(false);
  };

  const primaryLangQuestion = survey.questions.find(
    (q) => q.id === "primary_lang",
  );
  const frameworksQuestion = survey.questions.find(
    (q) => q.id === "frameworks",
  );
  const satisfactionQuestion = survey.questions.find(
    (q) => q.id === "satisfaction",
  );
  const commentQuestion = survey.questions.find((q) => q.id === "comment");

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 回答フォーム</CardTitle>
        <CardDescription>
          {submitted
            ? "回答ありがとうございました！"
            : "全ての質問にお答えください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-5xl">🎉</span>
            <p className="font-medium text-slate-900">回答を送信しました</p>
            <p className="text-sm text-slate-500">
              右のダッシュボードで結果を確認できます
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            {/* radio */}
            {primaryLangQuestion && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  {primaryLangQuestion.text}
                </p>
                <Controller
                  name="primary_lang"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      className="space-y-1.5"
                    >
                      {primaryLangQuestion.options?.map((opt) => (
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
                  )}
                />
                {errors.primary_lang && (
                  <p className="text-xs text-red-500">
                    {errors.primary_lang.message}
                  </p>
                )}
              </div>
            )}

            {/* checkbox */}
            {frameworksQuestion && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  {frameworksQuestion.text}
                </p>
                <Controller
                  name="frameworks"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-1.5">
                      {frameworksQuestion.options?.map((opt) => {
                        const checked = field.value?.includes(opt) ?? false;
                        return (
                          <label
                            key={opt}
                            className="flex cursor-pointer items-center gap-2.5"
                          >
                            <Checkbox.Root
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                const next = isChecked
                                  ? [...(field.value ?? []), opt]
                                  : (field.value ?? []).filter(
                                      (v) => v !== opt,
                                    );
                                field.onChange(next);
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
                  )}
                />
                {errors.frameworks && (
                  <p className="text-xs text-red-500">
                    {errors.frameworks.message}
                  </p>
                )}
              </div>
            )}

            {/* rating */}
            {satisfactionQuestion && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  {satisfactionQuestion.text}
                </p>
                <Controller
                  name="satisfaction"
                  control={control}
                  render={({ field }) => (
                    <StarRating
                      value={field.value ?? 0}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.satisfaction && (
                  <p className="text-xs text-red-500">
                    {errors.satisfaction.message}
                  </p>
                )}
              </div>
            )}

            {/* text */}
            {commentQuestion && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  {commentQuestion.text}
                </p>
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="自由にご記入ください（任意）"
                      className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  )}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "送信中..." : "回答を送信する"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
