import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
});

export type UserInput = z.infer<typeof userSchema>;