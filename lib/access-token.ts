import { z } from 'zod';
export const accessToken = z.object({ token_hash: z.string().min(1).max(512), type: z.enum(['invite','recovery']) });
