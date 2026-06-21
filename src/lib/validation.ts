import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const emailSchema = z.string().email("Invalid email address");

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const profileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  displayName: z
    .string()
    .max(50, "Display name must be at most 50 characters")
    .optional()
    .or(z.literal("")),
  photoUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export const changeEmailSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1, "Current password is required"),
});

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  confirm: z.literal("DELETE", {
    errorMap: () => ({ message: 'Type DELETE to confirm' }),
  }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const adminUserUpdateSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "admin"]).optional(),
  subscriptionTier: z.enum(["none", "basic", "standard", "premium"]).optional(),
  subscriptionStatus: z.enum(["active", "canceled"]).nullable().optional(),
  subscriptionEndsAt: z.string().datetime().nullable().optional(),
  trialEndsAt: z.string().datetime().nullable().optional(),
  extendTrialDays: z.number().int().min(1).max(90).optional(),
  clearSubscription: z.boolean().optional(),
});

export const filmSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.enum(["drama", "comedy", "animation", "sci-fi"]),
  posterUrl: z.string().url(),
  videoUrl: z.string().url(),
  duration: z.number().int().positive().max(180).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  featured: z.boolean().optional(),
});

export const ratingSchema = z.object({
  score: z.number().int().min(1).max(10),
});

export const subscribeSchema = z.object({
  planId: z.enum(["basic", "standard", "premium"]),
});
