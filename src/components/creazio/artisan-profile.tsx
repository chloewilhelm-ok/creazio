import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArtisanShell, PageTitle } from "./pages";
import { AddressFields } from "./session-state";
import { craftCategories, emptyAddress, savoirFaireByCategory, type Address, type CraftCategory } from "./catalog";

const statutLabel = { en_attente: "Candidature en attente de validation", validee: "Artisan validé", refusee: "Candidature refusée" } as const;

export function ArtisanProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["artisan-profil"], queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const [{ data: profile }, { data: artisan }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("artisans").select("*").eq("profile_id", user.id).maybeSingle(),
    ]);
    return { userId: user.id, profile, artisan };
  } });
  const [prenom, setPrenom] = useState(""); const [nom, setNom] = useState("");
  const [atelier, setAtelier] = useState(""); const [address, setAddress] = useState<Address>({ ...emptyAddress });
  const [category, setCategory] = useState<CraftCategory | "">("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const data = query.data;
  useEffect(() => {
    if (!data) return;
    setPrenom(data.profile?.prenom ?? ""); setNom(data.profile?.nom ?? "");
    const a = data.artisan;
    setAtelier(a?.nom_commercial ?? "");
    setAddress({ street: a?.adresse_ligne ?? data.profile?.adresse_ligne ?? "", postcode: (a?.code_postal ?? data.profile?.code_postal ?? "").trim(), city: a?.ville ?? data.profile?.ville ?? "", access: "" });
    const found = craftCategories.find(c => savoirFaireByCategory[c] === a?.savoir_faire_principal);
    setCategory(found ?? "");
  }, [data]);

  async function save() {
    if (!data) return;
    if (!category) { setMsg("Choisissez votre savoir-faire principal."); return; }
    setBusy(true); setMsg("");
    const fields = { nom_commercial: atelier, adresse_ligne: address.street, code_postal: address.postcode, ville: address.city, savoir_faire_principal: savoirFaireByCategory[category] };
    const { error: e1 } = await supabase.from("profiles").update({ prenom, nom }).eq("id", data.userId);
    const { error: e2 } = data.artisan
      ? await supabase.from("artisans").update(fields).eq("profile_id", data.userId)
      : await supabase.from("artisans").insert({ profile_id: data.userId, ...fields, statut_candidature: "en_attente" });
    setBusy(false);
    const error = e1 ?? e2;
    if (error) setMsg(friendlyAuthError(error.message)); else { setMsg("Votre profil a été enregistré."); await queryClient.invalidateQueries({ queryKey: ["artisan-profil"] }); }
  }
  async function logout() {
    await queryClient.cancelQueries(); queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/artisan/connexion", replace: true });
  }
  const statut = data?.artisan?.statut_candidature;
  return <ArtisanShell active="profil"><PageTitle title="Mon profil" body="Les informations de votre atelier, modifiables à tout moment."/>
    <section className="max-w-2xl rounded-2xl border bg-card p-6">
      <p className="mb-6 rounded-lg bg-accent p-3 text-sm font-semibold text-primary">{statut ? statutLabel[statut] : "Fiche atelier à compléter"}</p>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="label-font grid gap-2 text-sm font-semibold">Prénom<Input value={prenom} onChange={e => setPrenom(e.target.value)}/></label>
          <label className="label-font grid gap-2 text-sm font-semibold">Nom<Input value={nom} onChange={e => setNom(e.target.value)}/></label>
        </div>
        <label className="label-font grid gap-2 text-sm font-semibold">Email<Input value={data?.profile?.email ?? ""} disabled readOnly/></label>
        <label className="label-font grid gap-2 text-sm font-semibold">Nom de l’atelier<Input value={atelier} onChange={e => setAtelier(e.target.value)}/></label>
        <AddressFields artisan value={address} onChange={setAddress}/>
        <fieldset><legend className="mb-3 text-sm font-semibold">Savoir-faire principal</legend><div className="flex flex-wrap gap-2">{craftCategories.map(c => <Button key={c} type="button" size="sm" variant={category === c ? "default" : "outline"} aria-pressed={category === c} onClick={() => setCategory(c)} className="rounded-lg">{c}</Button>)}</div></fieldset>
        <Button onClick={save} disabled={busy || !data}>Enregistrer</Button>
        {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
        <Button variant="ghost" onClick={logout} className="text-muted-foreground"><LogOut/>Me déconnecter</Button>
      </div>
    </section>
  </ArtisanShell>;
}
