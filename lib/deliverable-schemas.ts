import { z } from "zod";
import { httpUrl } from "./validators";
import { DELIVERABLE_NETWORKS, DELIVERABLE_STATUSES } from "./deliverables";

// Validación de lo que manda el panel al crear o editar un entregable.

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const deliverableCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  network: z.enum(DELIVERABLE_NETWORKS).nullable().optional(),
  dueAt: dateInput.nullable().optional().or(z.literal("")),
});

export const deliverableUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  network: z.enum(DELIVERABLE_NETWORKS).nullable().optional(),
  dueAt: dateInput.nullable().optional().or(z.literal("")),
  status: z.enum(DELIVERABLE_STATUSES).optional(),
  proofUrl: httpUrl().nullable().optional().or(z.literal("")),
  /** Mover arriba o abajo en la lista */
  move: z.enum(["up", "down"]).optional(),
});
