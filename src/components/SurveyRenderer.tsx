import { useEffect, useMemo, useRef } from "react";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { buildSurveySpec, INITIAL_STATE } from "../lib/survey-spec";
import { registry } from "../lib/registry";
import type { ResponseItem, SurveyData } from "../lib/schema";

interface SurveyRendererProps {
  surveyData: SurveyData;
  onSubmit: (responses: ResponseItem[]) => Promise<void>;
}

export function SurveyRenderer({ surveyData, onSubmit }: SurveyRendererProps) {
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  const handlers = useMemo(
    () => ({
      submitSurvey: async (params: Record<string, unknown>) => {
        const responses: ResponseItem[] = [
          {
            questionId: "primary_lang",
            answer: (params.primary_lang as string) ?? "",
          },
          {
            questionId: "frameworks",
            answer: (params.frameworks as string[]) ?? [],
          },
          ...(params.satisfaction
            ? [
                {
                  questionId: "satisfaction",
                  answer: String(params.satisfaction),
                },
              ]
            : []),
          {
            questionId: "comment",
            answer: (params.comment as string) ?? "",
          },
        ];
        await onSubmitRef.current(responses);
      },
    }),
    [],
  );

  const spec = useMemo(() => buildSurveySpec(surveyData), [surveyData]);

  return (
    <JSONUIProvider
      registry={registry}
      initialState={INITIAL_STATE}
      handlers={handlers}
    >
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}
