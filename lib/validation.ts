import { z } from 'zod';
export const id = z.string().uuid();
export const actionFields = z.object({ title: z.string().trim().min(3).max(120), objective: z.string().trim().min(3).max(2000), location: z.string().trim().min(3).max(200), instructions: z.string().trim().max(3000), starts_at: z.string().datetime({ offset: true }), status: z.enum(['scheduled', 'cancelled']) });
export const quantity = z.coerce.number().int().min(1).max(100000);
export const received = z.coerce.number().int().min(0).max(100000);
