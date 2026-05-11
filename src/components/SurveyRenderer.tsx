import { useEffect, useMemo, useRef } from "react";
import { JSONUIProvider, Renderer } from "@json-render/react";
import type { Spec } from "@json-render/react";
import { INITIAL_STATE } from "../lib/survey-spec";
import { registry } from "../lib/registry";
import type { ResponseItem } from "../lib/schema";

interface SurveyRendererProps {
  spec: Spec;
  onSubmit?: (responses: ResponseItem[]) => Promise<void>;
}

export function SurveyRenderer({ spec, onSubmit }: SurveyRendererProps) {
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
        await onSubmitRef.current?.(responses);
      },
    }),
    [],
  );

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
