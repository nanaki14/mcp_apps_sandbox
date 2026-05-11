import { z } from "zod";

export const questionTypeSchema = z.enum(["radio", "checkbox", "rating", "text"]);

export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: questionTypeSchema,
  options: z.array(z.string()).optional(),
  max: z.number().optional(),
});

export const surveySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  questions: z.array(questionSchema),
});

export const questionResultSchema = z.object({
  questionId: z.string(),
  answers: z.record(z.string(), z.number()),
});

export const surveyDataSchema = z.object({
  survey: surveySchema,
  results: z.array(questionResultSchema),
  totalResponses: z.number(),
});

export const responseItemSchema = z.object({
  questionId: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
});

export type Question = z.infer<typeof questionSchema>;
export type Survey = z.infer<typeof surveySchema>;
export type QuestionResult = z.infer<typeof questionResultSchema>;
export type SurveyData = z.infer<typeof surveyDataSchema>;
export type ResponseItem = z.infer<typeof responseItemSchema>;
