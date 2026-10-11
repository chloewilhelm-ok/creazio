import { createContext, useContext, useState, type ReactNode } from "react";
import { craftCategories, craftTechniques, emptyAddress, toggleSelection, upsertWorkshop, type Address, type ArtisanInfo, type WorkshopDraft } from "./catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

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
  return <SessionContext.Provider value={{ inspirations, setInspirations, studentAddress, setStudentAddress, artisan, setArtisan, workshops, saveWorkshop: workshop => setWorkshops(items => upsertWorkshop(items, workshop)), deleteWorkshop: id => setWorkshops(items => items.filter(item => item.id !== id)) }}>{children}</SessionContext.Provider>;
}
export function useCreazioSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("CreazioSessionProvider is required");
  return session;
}
export function CategoryPicker({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  return <div className="flex flex-wrap gap-2">{craftCategories.map(category => <Button type="button" key={category} variant={values.includes(category) ? "default" : "outline"} aria-pressed={values.includes(category)} onClick={() => onChange(toggleSelection(values, category))} className="h-auto min-h-11 whitespace-normal rounded-lg px-3 py-2 text-left text-xs">{values.includes(category) && <Check className="size-4 shrink-0"/>}{category}</Button>)}</div>;
}
export function AddressFields({ value, onChange, artisan = false }: { value: Address; onChange: (address: Address) => void; artisan?: boolean }) {
  return <div className="grid gap-4"><label className="grid gap-2 text-sm font-semibold">{artisan ? "Adresse de l’atelier" : "Adresse principale"}<Input required autoComplete="street-address" value={value.street} onChange={event => onChange({ ...value, street: event.target.value })} placeholder="Numéro et rue"/></label><div className="grid grid-cols-[1fr_1.4fr] gap-4"><label className="grid gap-2 text-sm font-semibold">Code postal<Input required inputMode="numeric" autoComplete="postal-code" value={value.postcode} onChange={event => onChange({ ...value, postcode: event.target.value })} placeholder="75011"/></label><label className="grid gap-2 text-sm font-semibold">Ville<Input required autoComplete="address-level2" value={value.city} onChange={event => onChange({ ...value, city: event.target.value })} placeholder="Paris"/></label></div>{artisan && <label className="grid gap-2 text-sm font-semibold">Précisions d’accès<Textarea className="rounded-lg" value={value.access} onChange={event => onChange({ ...value, access: event.target.value })} placeholder="Étage, code d’accès, métro, accessibilité…"/></label>}</div>;
}
export function ArtisanOnboardingFields() {
  const { artisan, setArtisan } = useCreazioSession();
  const techniques = artisan.categories.flatMap(category => craftTechniques[category as keyof typeof craftTechniques] ?? []);
  return <div className="grid gap-6"><section className="grid gap-4"><h2 className="text-lg font-semibold">Localisation de votre atelier</h2><AddressFields value={artisan.address} onChange={address => setArtisan({ ...artisan, address })} artisan/></section><section className="grid gap-4"><h2 className="text-lg font-semibold">Vos savoir-faire</h2><CategoryPicker values={artisan.categories} onChange={categories => setArtisan({ ...artisan, categories, techniques: artisan.techniques.filter(technique => categories.some(category => (craftTechniques[category as keyof typeof craftTechniques] ?? []).includes(technique))) })}/>{techniques.length > 0 && <div className="grid gap-2"><h3 className="text-sm font-semibold">Techniques pratiquées</h3><div className="flex flex-wrap gap-2">{techniques.map(technique => <Button key={technique} type="button" size="sm" variant={artisan.techniques.includes(technique) ? "secondary" : "outline"} aria-pressed={artisan.techniques.includes(technique)} onClick={() => setArtisan({ ...artisan, techniques: toggleSelection(artisan.techniques, technique) })} className="h-auto min-h-11 whitespace-normal rounded-lg">{artisan.techniques.includes(technique) && <Check/>}{technique}</Button>)}</div></div>}<label className="grid gap-2 text-sm font-semibold">Votre spécialité et votre expérience<Textarea required className="min-h-28 rounded-lg" value={artisan.expertise} onChange={event => setArtisan({ ...artisan, expertise: event.target.value })} placeholder="Précisez vos techniques, matières travaillées et objets que les élèves pourront réaliser…"/></label></section></div>;
}