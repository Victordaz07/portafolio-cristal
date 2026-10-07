import { Prisma } from "@prisma/client";
import { prismaRoot } from "./prisma-root";
import { TenantError, currentCreatorId } from "./tenant";

// `prisma`: el cliente de siempre, pero cada consulta queda limitada a la creadora
// de la petición (ver lib/tenant.ts). Lee solo sus filas, crea filas a su nombre y
// solo puede editar o borrar lo suyo. Si no se sabe de qué creadora es la petición,
// la consulta falla: nunca se devuelven datos "de cualquiera".

/** Modelos que pertenecen a una creadora (todos tienen `creatorId`). */
const TENANT_MODELS = new Set<string>([
  "Hero", "Stat", "ContentCard", "Brand", "BrandEvent", "Review", "Service", "Testimonial", "Package",
  "FaqItem", "ContactMessage", "AdminUser", "SiteSettings", "SocialAccount", "Goal", "ActionItem",
  "LogEntry", "ScheduledPost", "FollowerSnapshot", "Payment", "BioLink", "BioLinkGroup", "InboxReply", "SupportTicket", "DataRequest",
  "Deliverable", "Invoice", "BillingProfile", "Contract", "CampaignReport",
]);

/** Modelos que apuntan a una Brand: el brandId tiene que ser de la misma creadora. */
const BRAND_REF_MODELS = new Set<string>(["ContentCard", "ScheduledPost", "BrandEvent", "Deliverable", "Invoice", "Contract", "CampaignReport"]);

const WHERE_OPS = new Set([
  "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "count", "aggregate",
  "groupBy", "update", "updateMany", "updateManyAndReturn", "delete", "deleteMany", "upsert",
]);

type Args = Record<string, unknown> & { where?: object; data?: unknown; create?: object; update?: unknown };

async function assertOwnBrand(data: unknown, creatorId: string) {
  const items = Array.isArray(data) ? data : [data];
  for (const item of items) {
    const brandId = item && typeof item === "object" ? (item as { brandId?: unknown }).brandId : undefined;
    if (typeof brandId !== "string") continue;
    const owned = await prismaRoot.brand.count({ where: { id: brandId, creatorId } });
    if (!owned) throw new TenantError("La marca no existe");
  }
}

export const prisma = prismaRoot.$extends({
  name: "foliocrew-tenant",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!TENANT_MODELS.has(model)) return query(args);
        const creatorId = await currentCreatorId();
        const a = { ...(args as Args) };

        if (WHERE_OPS.has(operation)) a.where = { ...(a.where ?? {}), creatorId };

        if (operation === "create" || operation === "createMany" || operation === "createManyAndReturn") {
          a.data = Array.isArray(a.data)
            ? a.data.map((row) => ({ ...(row as object), creatorId }))
            : { ...(a.data as object), creatorId };
        }
        if (operation === "upsert") a.create = { ...(a.create ?? {}), creatorId };

        // Nadie puede mover una fila a otra creadora.
        for (const key of ["data", "update"] as const) {
          if (operation === "create" || operation === "createMany" || operation === "createManyAndReturn") break;
          if (a[key] && typeof a[key] === "object" && !Array.isArray(a[key])) {
            const rest = { ...(a[key] as Record<string, unknown>) };
            delete rest.creatorId;
            a[key] = rest;
          }
        }

        if (BRAND_REF_MODELS.has(model)) {
          if (a.data) await assertOwnBrand(a.data, creatorId);
          if (a.create) await assertOwnBrand(a.create, creatorId);
          if (a.update) await assertOwnBrand(a.update, creatorId);
        }
        return query(a as typeof args);
      },
    },
  },
});

export { prismaRoot, Prisma };
