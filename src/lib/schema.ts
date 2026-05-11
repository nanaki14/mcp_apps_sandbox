import { z } from "zod";

export const responseItemSchema = z.object({
  questionId: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
});

export type ResponseItem = z.infer<typeof responseItemSchema>;
