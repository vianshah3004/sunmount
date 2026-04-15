import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(8)
});

export const signupSchema = z
  .object({
    username: z.string().trim().min(3).max(64),
    password: z.string().min(8).max(128),
    role: z.enum(["ADMIN", "OPERATOR", "ACCOUNTANT"]).optional()
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
