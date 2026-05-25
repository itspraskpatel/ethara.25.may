import { z } from 'zod';

export const boardSlugSchema = z
  .string()
  .trim()
  .min(8, 'Board link is invalid')
  .max(64, 'Board link is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Board link can only contain letters, numbers, dashes, and underscores');

export const visitorSchema = z.object({
  boardSlug: boardSlugSchema,
  browserId: z.string().trim().min(16).max(128),
  displayName: z.string().trim().min(1, 'Display name is required').max(80, 'Display name is too long'),
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email('Enter a valid email address').max(254).optional(),
  ),
});

export const profileFormSchema = visitorSchema.pick({
  displayName: true,
  email: true,
});

export type VisitorInput = z.input<typeof visitorSchema>;
export type VisitorPayload = z.output<typeof visitorSchema>;
export type ProfileFormPayload = z.output<typeof profileFormSchema>;
