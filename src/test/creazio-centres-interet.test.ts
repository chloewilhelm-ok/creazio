import { beforeEach, describe, expect, it, vi } from "vitest";

// Faux client Supabase : on compte les centres d'intérêt existants et on capture les insertions.
const db = vi.hoisted(() => ({ existants: 0, inserts: [] as unknown[] }));
vi.mock("@/integrations/supabase/client", () => {
  const chain = {
    select: () => chain,
    eq: () =>
      chain.lastOp === "select" ? Promise.resolve({ count: db.existants }) : Promise.resolve({}),
    delete: () => ((chain.lastOp = "delete"), chain),
    insert: (rows: unknown[]) => (db.inserts.push(...rows), Promise.resolve({})),
    lastOp: "select",
  };
  return { supabase: { from: () => ((chain.lastOp = "select"), chain) } };
});

import { ensureSignupInterests } from "@/lib/workshops";

describe("ateliers favoris choisis à l'inscription", () => {
  beforeEach(() => {
    db.existants = 0;
    db.inserts = [];
  });

  it("sont enregistrés si l'élève n'a encore aucun centre d'intérêt", async () => {
    await ensureSignupInterests({
      id: "eleve-1",
      user_metadata: { role: "eleve", categories: ["Métal", "Poterie et Céramique"] },
    });
    expect(db.inserts).toEqual([
      { profile_id: "eleve-1", savoir_faire: "metal" },
      { profile_id: "eleve-1", savoir_faire: "poterie_ceramique" },
    ]);
  });

  it("ne remplacent pas des centres d'intérêt déjà enregistrés", async () => {
    db.existants = 2;
    await ensureSignupInterests({
      id: "eleve-1",
      user_metadata: { role: "eleve", categories: ["Métal"] },
    });
    expect(db.inserts).toEqual([]);
  });

  it("ne concernent pas les artisans, gérés par le trigger de la base", async () => {
    await ensureSignupInterests({
      id: "artisan-1",
      user_metadata: { role: "artisan", categories: ["Cuir"] },
    });
    expect(db.inserts).toEqual([]);
  });
});
