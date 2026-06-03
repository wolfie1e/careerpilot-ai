import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ and - only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().max(255).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  full_name: z.string().max(255, "Name is too long").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ and - only"),
  avatar_url: z
    .string()
    .url("Avatar must be a valid URL")
    .or(z.literal(""))
    .optional(),
});

export const passwordSchema = z
  .object({
    current_password: z.string().min(8, "Current password must be at least 8 characters"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Please confirm the new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;

export const interviewSetupSchema = z.object({
  role_title: z.string().trim().min(2, "Enter a target role").max(120, "Role is too long"),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  interview_type: z.enum(["behavioral", "technical", "hr", "mixed", "system_design"]),
  session_mode: z.enum(["text", "voice"]),
  question_count: z.number().int().min(1).max(10),
});

export type InterviewSetupFormData = z.infer<typeof interviewSetupSchema>;
