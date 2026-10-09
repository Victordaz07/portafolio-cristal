import { test } from "node:test";
import assert from "node:assert/strict";
import { prismaRoot } from "../lib/prisma-root";
import { agencyOwnsCreator, agencyCreatorCount, agencyTeamEmails } from "../lib/agency";

// Aislamiento de cartera (plan Crew): una creadora que no está en la cartera de una agencia nunca
// debe considerarse alcanzable por esa agencia, sin importar cuántas otras agencias o creadoras
// existan. Es el equivalente, en una prueba, a lo que en Peekmedia garantiza la RLS de Postgres
// (ver docs del plan Crew: aquí no hay RLS, solo este chequeo — por eso tiene que estar probado).
const skip = !process.env.DATABASE_URL;

test("una creadora fuera de la cartera de una agencia nunca es \"suya\"", { skip }, async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const agencyA = await prismaRoot.agency.create({ data: { name: "Agencia A", slug: `agencia-a-${suffix}` } });
  const agencyB = await prismaRoot.agency.create({ data: { name: "Agencia B", slug: `agencia-b-${suffix}` } });
  const inRosterA = await prismaRoot.creator.create({ data: { slug: `creadora-a-${suffix}`, name: "De Agencia A", plan: "crew", agencyId: agencyA.id } });
  const inRosterB = await prismaRoot.creator.create({ data: { slug: `creadora-b-${suffix}`, name: "De Agencia B", plan: "crew", agencyId: agencyB.id } });
  const independent = await prismaRoot.creator.create({ data: { slug: `creadora-libre-${suffix}`, name: "Independiente", plan: "pro" } });

  try {
    // Lo suyo, sí.
    assert.equal(await agencyOwnsCreator(agencyA.id, inRosterA.id), true);
    // De otra agencia, nunca — aunque A exista y B exista, A no puede ver a B.
    assert.equal(await agencyOwnsCreator(agencyA.id, inRosterB.id), false);
    assert.equal(await agencyOwnsCreator(agencyB.id, inRosterA.id), false);
    // Una creadora independiente (sin agencia) no es de nadie.
    assert.equal(await agencyOwnsCreator(agencyA.id, independent.id), false);
    assert.equal(await agencyOwnsCreator(agencyB.id, independent.id), false);
    // Un id que no existe tampoco es de nadie (no debe lanzar).
    assert.equal(await agencyOwnsCreator(agencyA.id, "no-existe"), false);

    // Cada agencia solo cuenta lo suyo.
    assert.equal(await agencyCreatorCount(agencyA.id), 1);
    assert.equal(await agencyCreatorCount(agencyB.id), 1);
  } finally {
    await prismaRoot.creator.deleteMany({ where: { id: { in: [inRosterA.id, inRosterB.id, independent.id] } } });
    await prismaRoot.agency.deleteMany({ where: { id: { in: [agencyA.id, agencyB.id] } } });
  }
});

test("agencyTeamEmails solo devuelve a quienes están en esa agencia", { skip }, async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const agencyA = await prismaRoot.agency.create({ data: { name: "Agencia A", slug: `equipo-a-${suffix}` } });
  const agencyB = await prismaRoot.agency.create({ data: { name: "Agencia B", slug: `equipo-b-${suffix}` } });
  const creatorForA = await prismaRoot.creator.create({ data: { slug: `due-a-${suffix}`, name: "Dueña A", plan: "crew", agencyId: agencyA.id } });
  const creatorForB = await prismaRoot.creator.create({ data: { slug: `due-b-${suffix}`, name: "Dueña B", plan: "crew", agencyId: agencyB.id } });
  const memberA = await prismaRoot.adminUser.create({
    data: { email: `due-a-${suffix}@test.foliocrew.pro`, passwordHash: "x", creatorId: creatorForA.id, agencyId: agencyA.id, agencyRole: "owner" },
  });
  const memberB = await prismaRoot.adminUser.create({
    data: { email: `due-b-${suffix}@test.foliocrew.pro`, passwordHash: "x", creatorId: creatorForB.id, agencyId: agencyB.id, agencyRole: "owner" },
  });

  try {
    const emailsA = await agencyTeamEmails(agencyA.id);
    assert.deepEqual(emailsA, [memberA.email]);
    assert.ok(!emailsA.includes(memberB.email));
  } finally {
    await prismaRoot.adminUser.deleteMany({ where: { id: { in: [memberA.id, memberB.id] } } });
    await prismaRoot.creator.deleteMany({ where: { id: { in: [creatorForA.id, creatorForB.id] } } });
    await prismaRoot.agency.deleteMany({ where: { id: { in: [agencyA.id, agencyB.id] } } });
  }
});

test.after(async () => {
  if (!skip) await prismaRoot.$disconnect();
});
