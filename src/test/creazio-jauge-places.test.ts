import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { libellePlaces } from "@/components/creazio/workshop-slots";

describe("places restantes d'un créneau", () => {
  it("alerte quand il reste peu de places", () => {
    expect(libellePlaces(1)).toBe("Plus qu’une place");
    expect(libellePlaces(2)).toBe("Plus que 2 places");
  });
  it("affiche le nombre de places sinon", () => {
    expect(libellePlaces(4)).toBe("4 places disponibles");
  });
});
