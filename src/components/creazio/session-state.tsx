import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { labelSavoirFaire } from "@/lib/workshops";
import { emptyAddress, upsertWorkshop, type Address, type ArtisanInfo, type WorkshopDraft } from "./catalog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SavoirFaireGrid } from "./savoir-faire-grid";

interface SessionState {
  inspirations: string[]; setInspirations: (values: string[]) => void;
  studentAddress: Address; setStudentAddress: (address: Address) => void;
  artisan: ArtisanInfo; setArtisan: (info: ArtisanInfo) => void;
  workshops: WorkshopDraft[]; saveWorkshop: (workshop: WorkshopDraft) => void; deleteWorkshop: (id: string) => void;
}
const SessionContext = createContext<SessionState | undefined>(undefined);
// Only user-entered preview values live in React memory. No storage or backend writes.
export function CreazioSessionProvider({ children }: { children: ReactNode }) {
  const [inspirations, setInspirations] = useState<string[]>([]);
  const [studentAddress, setStudentAddress] = useState<Address>({ ...emptyAddress });
  const [artisan, setArtisan] = useState<ArtisanInfo>({ name: "", address: { ...emptyAddress }, categories: [], techniques: [], expertise: "" });
  const [workshops, setWorkshops] = useState<WorkshopDraft[]>([]);
  // Charge les ateliers de l'artisan connecté depuis Supabase (une fois par session).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: ateliers } = await supabase.from("ateliers")
        .select("id,titre,description,savoir_faire,duree_minutes,taille_groupe_max,materiel_inclus,informations_pratiques,adresse_ligne,code_postal,ville,photo_url,prix_public_eur,statut")
        .eq("artisan_id", user.id).order("cree_le", { ascending: false });
      if (!ateliers?.length || cancelled) return;
      const { data: recurrences } = await supabase.from("recurrences_sessions")
        .select("atelier_id,jour_semaine,heure_debut,places_totales,places_ouvertes_creazio,remise_pct,date_debut,date_fin")
        .in("atelier_id", ateliers.map(a => a.id));
      if (cancelled) return;
      const dayLabel: Record<string, string> = { lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi", jeudi: "Jeudi", vendredi: "Vendredi", samedi: "Samedi", dimanche: "Dimanche" };
      const loaded: WorkshopDraft[] = ateliers.map(a => {
        const recs = (recurrences ?? []).filter(r => r.atelier_id === a.id);
        const first = recs[0];
        return {
          id: a.id, title: a.titre, category: labelSavoirFaire(a.savoir_faire), technique: "",
          description: a.description, duration: a.duree_minutes ? `${Math.floor(a.duree_minutes / 60)}h${String(a.duree_minutes % 60).padStart(2, "0")}` : "",
          capacity: String(a.taille_groupe_max ?? ""), price: a.prix_public_eur != null ? String(a.prix_public_eur) : "",
          discount: first ? String(first.remise_pct) : "", materials: a.materiel_inclus ?? "", level: "Tous niveaux",
          address: { street: a.adresse_ligne, postcode: a.code_postal, city: a.ville, access: a.informations_pratiques ?? "" },
          date: first?.date_debut ?? "", endDate: first?.date_fin ?? "",
          days: recs.map(r => dayLabel[r.jour_semaine] ?? r.jour_semaine),
          allocation: first ? String(first.places_ouvertes_creazio) : "", time: first?.heure_debut?.slice(0, 5) ?? "",
          image: a.photo_url ?? "", status: "published",
        };
      });
      setWorkshops(items => {
        const known = new Set(items.map(i => i.id));
        return [...loaded.filter(l => !known.has(l.id)), ...items];
      });
    })();
    return () => { cancelled = true; };
  }, []);
  return <SessionContext.Provider value={{ inspirations, setInspirations, studentAddress, setStudentAddress, artisan, setArtisan, workshops, saveWorkshop: workshop => setWorkshops(items => upsertWorkshop(items, workshop)), deleteWorkshop: id => setWorkshops(items => items.filter(item => item.id !== id)) }}>{children}</SessionContext.Provider>;
}
export function useCreazioSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("CreazioSessionProvider is required");
  return session;
}
/** Choix des savoir-faire : la grille à icônes de la landing, en version sélectionnable. */
export function CategoryPicker({ values, onChange, describedBy }: { values: string[]; onChange: (values: string[]) => void; describedBy?: string }) {
  return <SavoirFaireGrid values={values} onChange={onChange} {...(describedBy ? { describedBy } : {})}/>;
}
export function AddressFields({ value, onChange, artisan = false }: { value: Address; onChange: (address: Address) => void; artisan?: boolean }) {
  return <div className="grid gap-4"><label className="label-font grid gap-2 text-sm font-semibold">{artisan ? "Adresse de l’atelier" : "Adresse principale"}<Input required autoComplete="street-address" value={value.street} onChange={event => onChange({ ...value, street: event.target.value })} placeholder="Numéro et rue"/></label><div className="grid grid-cols-[1fr_1.4fr] gap-4"><label className="label-font grid gap-2 text-sm font-semibold">Code postal<Input required inputMode="numeric" autoComplete="postal-code" value={value.postcode} onChange={event => onChange({ ...value, postcode: event.target.value })} placeholder="75011"/></label><label className="label-font grid gap-2 text-sm font-semibold">Ville<Input required autoComplete="address-level2" value={value.city} onChange={event => onChange({ ...value, city: event.target.value })} placeholder="Paris"/></label></div>{artisan && <label className="label-font grid gap-2 text-sm font-semibold">Précisions d’accès<Textarea className="rounded-lg" value={value.access} onChange={event => onChange({ ...value, access: event.target.value })} placeholder="Étage, code d’accès, métro, accessibilité…"/></label>}</div>;
}
