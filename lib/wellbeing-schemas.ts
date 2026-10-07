import { z } from "zod";
import { CONTENT_TYPES, PLAN_NETWORKS } from "@/lib/content-plan";
import { httpUrl } from "@/lib/validators";
import { MAX_LOAD_LIMIT } from "@/lib/wellbeing";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const loadSchema = z.object({ loadLimit: z.number().int().min(1).max(MAX_LOAD_LIMIT) });

export const restSchema = z.object({
  start: dateKey,
  end: dateKey,
  note: z.string().trim().max(300).default(""),
  moveDeliverables: z.boolean().default(false),
  /** true = solo mostrar qué se movería, sin tocar nada */
  preview: z.boolean().default(false),
});

export const noticeSchema = z.object({ brandId: z.string().min(1).max(60), message: z.string().trim().min(10).max(2000) });

export const bankSchema = z.object({
  title: z.string().trim().min(1).max(120),
  caption: z.string().max(5000).default(""),
  contentType: z.enum(CONTENT_TYPES).default("reel"),
  networks: z.array(z.enum(PLAN_NETWORKS)).max(4).default([]),
  mediaUrl: httpUrl().nullable().optional().or(z.literal("")),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
});

export const scheduleSchema = z.object({
  date: dateKey,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  networks: z.array(z.enum(PLAN_NETWORKS)).min(1).max(4),
});
