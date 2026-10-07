import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { csvCell, nextQuarterlyDate, parseAmount, summarizeYear, taxReserve, toCsv } from "../lib/income";

describe("resumen del año", () => {
  const s = summarizeYear(
    [
      { date: "2026-01-10", cents: 100_000, source: "brand" },
      { date: "2026-01-20", cents: 50_000, source: "affiliate" },
      { date: "2026-03-01", cents: 20_000, source: "brand" },
      { date: "2025-12-31", cents: 99_999, source: "brand" },
      { date: "2026-02-01", cents: -5, source: "brand" },
    ],
    [
      { date: "2026-01-15", cents: 30_000, category: "equipment" },
      { date: "2027-01-01", cents: 1, category: "other" },
    ],
    2026
  );
  it("suma por mes, fuente y categoría, solo del año pedido", () => {
    assert.equal(s.months[0].income, 150_000);
    assert.equal(s.months[0].expenses, 30_000);
    assert.equal(s.months[0].net, 120_000);
    assert.equal(s.bySource.brand, 120_000);
    assert.equal(s.bySource.affiliate, 50_000);
    assert.equal(s.byCategory.equipment, 30_000);
    assert.equal(s.income, 170_000);
    assert.equal(s.net, 140_000);
  });
});

describe("apartado de impuestos", () => {
  it("es el porcentaje de la ganancia y nunca negativo", () => {
    assert.equal(taxReserve(100_000, 25), 25_000);
    assert.equal(taxReserve(-500, 25), 0);
    assert.equal(taxReserve(100_000, 500), 60_000);
    assert.equal(taxReserve(100_000, Number.NaN), 25_000);
  });
});

describe("fechas trimestrales", () => {
  it("elige la siguiente fecha y cuenta los días", () => {
    const a = nextQuarterlyDate(new Date("2026-10-07T10:00:00Z"));
    assert.equal(a.date.toISOString().slice(0, 10), "2027-01-15");
    assert.equal(a.days, 100);
  });
  it("el mismo día cuenta como hoy y el fin de semana pasa al lunes", () => {
    assert.equal(nextQuarterlyDate(new Date("2026-04-15T00:00:00Z")).days, 0);
    // 15 de junio de 2025 fue domingo → lunes 16
    assert.equal(nextQuarterlyDate(new Date("2025-05-01T00:00:00Z")).date.toISOString().slice(0, 10), "2025-06-16");
  });
});

describe("CSV", () => {
  it("protege contra fórmulas y escapa comas y comillas", () => {
    assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
    assert.equal(csvCell("a,b"), '"a,b"');
    assert.equal(csvCell('di "hola"'), '"di ""hola"""');
    assert.equal(csvCell(5), "5");
  });
  it("ordena por fecha y escribe los montos en dólares", () => {
    const csv = toCsv([
      { date: "2026-02-01", type: "expense", category: "Equipo", description: "Luz", cents: 1234 },
      { date: "2026-01-01", type: "income", category: "Marcas", description: "Factura FC-1", cents: 500_000 },
    ]);
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    assert.equal(lines[0], "Fecha,Tipo,Categoría,Descripción,Monto (USD)");
    assert.equal(lines[1], "2026-01-01,Ingreso,Marcas,Factura FC-1,5000.00");
    assert.equal(lines[2], "2026-02-01,Gasto,Equipo,Luz,12.34");
  });
});

describe("montos escritos", () => {
  it("entiende puntos, comas y símbolos", () => {
    assert.equal(parseAmount("12.50"), 1250);
    assert.equal(parseAmount("12,5"), 1250);
    assert.equal(parseAmount("$1,200.00"), 120_000);
    assert.equal(parseAmount("1.200"), 120_000);
    assert.equal(parseAmount("300"), 30_000);
    assert.equal(parseAmount(""), null);
    assert.equal(parseAmount("0"), null);
    assert.equal(parseAmount("abc"), null);
  });
});
