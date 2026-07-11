export interface Orderable {
  id: string;
  order: number;
}

/** Intercambia el `order` de dos items adyacentes y persiste el cambio vía PATCH. */
export async function swapOrder<T extends Orderable>(
  items: T[],
  index: number,
  direction: "up" | "down",
  apiBase: string
): Promise<T[]> {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  const a = next[index];
  const b = next[targetIndex];
  const aOrder = a.order;
  const bOrder = b.order;

  next[index] = { ...a, order: bOrder };
  next[targetIndex] = { ...b, order: aOrder };
  next.sort((x, y) => x.order - y.order);

  await Promise.all([
    fetch(`${apiBase}/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: bOrder }),
    }),
    fetch(`${apiBase}/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: aOrder }),
    }),
  ]);

  return next;
}
