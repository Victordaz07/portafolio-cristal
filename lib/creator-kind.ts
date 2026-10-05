// Cómo trabaja con marcas cada cuenta de Foliocrew. Cambia las plantillas del asistente,
// el contexto de la IA y algunos textos por defecto; el sitio sigue siendo 100 % editable.

export type CreatorKind = "contenido" | "ugc" | "ambos";

export const CREATOR_KINDS: {
  id: CreatorKind;
  label: string;
  labelEn: string;
  hint: string;
  hintEn: string;
  /** Cómo describirlo en los textos de la IA y en los títulos por defecto. */
  role: string;
  roleEn: string;
}[] = [
  {
    id: "contenido",
    label: "Creador/a de contenido",
    labelEn: "Content creator",
    hint: "Publicas en tus redes, tienes comunidad y las marcas te pagan por mostrar sus productos a tu audiencia.",
    hintEn: "You post on your social accounts, have a community, and brands pay you to show their products to your audience.",
    role: "creador(a) de contenido",
    roleEn: "content creator",
  },
  {
    id: "ugc",
    label: "Creador/a UGC",
    labelEn: "UGC creator",
    hint: "Creas videos y fotos para que la marca los publique en sus redes y anuncios; no importa cuántos seguidores tengas.",
    hintEn: "You create videos and photos for brands to post on their channels and ads; your follower count doesn't matter.",
    role: "creador(a) de contenido UGC",
    roleEn: "UGC creator",
  },
  {
    id: "ambos",
    label: "Las dos cosas",
    labelEn: "Both",
    hint: "Publicas en tus redes y también haces contenido UGC para las marcas.",
    hintEn: "You post on your social accounts and also make UGC content for brands.",
    role: "creador(a) de contenido y UGC",
    roleEn: "content & UGC creator",
  },
];

export function isCreatorKind(value: unknown): value is CreatorKind {
  return value === "contenido" || value === "ugc" || value === "ambos";
}

export function creatorKind(value: string | null | undefined): CreatorKind {
  return isCreatorKind(value) ? value : "contenido";
}

export function kindInfo(value: string | null | undefined) {
  const id = creatorKind(value);
  return CREATOR_KINDS.find((k) => k.id === id)!;
}
