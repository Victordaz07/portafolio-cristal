import { z } from "zod";
import { GOAL_CATEGORIES, GOAL_SOURCES, LOG_KINDS } from "@/lib/growth";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const goalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(GOAL_CATEGORIES),
  current: z.number().finite().min(0),
  target: z.number().finite().positive(),
  unit: z.string().trim().max(20).nullable().optional(),
  source: z.enum(Object.keys(GOAL_SOURCES) as [string, ...string[]]),
  dueDate: dateKey.nullable().optional().or(z.literal("")),
  archived: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const actionSchema = z.object({
  label: z.string().trim().min(1).max(300),
  category: z.enum(GOAL_CATEGORIES),
  done: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const logSchema = z.object({
  kind: z.enum(LOG_KINDS),
  date: dateKey,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional().default(""),
});
