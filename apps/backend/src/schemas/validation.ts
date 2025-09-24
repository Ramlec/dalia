import { z } from 'zod'

// Paramètres de route
export const userIdParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'userId must be a positive integer').transform(Number)
})

export const sleepIdParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'userId must be a positive integer').transform(Number),
  sleepId: z.string().regex(/^\d+$/, 'sleepId must be a positive integer').transform(Number)
})

// Query parameters pour les sleeps (pagination, tri, filtres)
export const sleepQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(50),
  sortBy: z.enum(['date', 'score', 'duration_min', 'bedtime_full']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  minScore: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxScore: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
})

// Schémas de réponse
export const userSchema = z.object({
  id: z.number(),
  firstname: z.string(),
  lastname: z.string()
})

export const sleepSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date: z.string(),
  duration: z.string().nullable(),
  duration_min: z.number().nullable(),
  mean_hr: z.number().nullable(),
  bedtime: z.string().nullable(),
  waketime: z.string().nullable(),
  score: z.number().nullable(),
  bedtime_full: z.string().nullable(),
  waketime_full: z.string().nullable()
})

export const usersListSchema = z.array(userSchema)
export const sleepsListSchema = z.array(sleepSchema)
