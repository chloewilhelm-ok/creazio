import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile, friendlyAuthError, pendingProfileFromMetadata } from "@/lib/auth";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, ChevronRight, CircleUserRound, Clock3, Coins, Euro, Eye, Filter, Heart, LogOut, MapPin, Menu, Palette, Percent, Search, Sparkles, Users, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import hero from "@/assets/creazio-hero.jpg";
import pottery from "@/assets/creazio-pottery.jpg";
import leather from "@/assets/creazio-leather.jpg";
import printmaking from "@/assets/creazio-print.jpg";
import { cn } from "@/lib/utils";
import { RAYON_RECOMMANDATION_KM, distanceKm, ensureSignupInterests, formatDuree, geocodeAddress, labelSavoirFaire, publishedWorkshopsQuery, recommendationsQuery, saveInterests, workshopQuery } from "@/lib/workshops";
import { craftCategories, savoirFaireByCategory, type CraftCategory } from "./catalog";
import { AddressFields, ArtisanOnboardingFields, CategoryPicker, useCreazioSession } from "./session-state";
import { WorkshopSlots } from "./workshop-slots";
import { SavoirFaireGrid } from "./savoir-faire-grid";
import { photoAtelier } from "@/lib/photos-ateliers";
import { AddressAutocomplete } from "./address-autocomplete";
import { metadonneesInscription, premierChampEnErreur, validerCompte, validerInspirations, type ChampCompte, type Consentements, type ErreursInspirations } from "@/lib/inscription";
import { acheterPackDemo, annulerReservation, toReservationError, delaiAnnulationQuery, formatCredits, formatHeure, formatJour, messageErreur, peutAnnuler, reservationQuery, upcomingReservationsQuery, walletQuery, type UpcomingReservation } from "@/lib/reservations";

const workshops = [
  { id: "tour-de-potier", category: "Céramique", title: "Initiation au tour de potier", artisan: "Michel, céramiste", place: "Paris 11e", duration: "2h30", credits: 32, old: 36, image: pottery },
  { id: "porte-cartes", category: "Maroquinerie", title: "Fabrication d’un porte-cartes en cuir", artisan: "Claire, maroquinière", place: "Paris 10e", duration: "2h", credits: 30, old: 35, image: leather },
  { id: "linogravure", category: "Gravure", title: "Création et tirage de linogravure", artisan: "Antoine, graveur", place: "Paris 18e", duration: "3h", credits: 27, old: 32, image: printmaking },
];
const crafts = craftCategories;

function Logo({large=false}:{large?:boolean}) {
  return <Link to="/" className={cn("flex items-center gap-2 font-bold text-primary",large?"text-2xl sm:text-3xl":"text-xl sm:text-2xl")}><Palette className={large?"size-7 sm:size-8":"size-6"} aria-hidden="true"/><span>Creazio</span></Link>;
}

// « Espace artisans » : étiquette discrète pour signaler le changement d'univers (texte #0F3D3A sur #FFF6E0 : 11,2:1).
const ETIQUETTE_ARTISANS="inline-flex items-center rounded-full border border-laiton bg-laiton-pale px-3.5 py-1 text-sm font-normal text-deep-forest transition hover:bg-abricot focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest focus-visible:ring-offset-2";
// « Se connecter » et « S'inscrire » : même taille, même police ; plein pour l'action principale, contour pour la secondaire.
const BOUTON_ENTETE="inline-flex h-10 items-center justify-center rounded-[8px] px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-forest focus-visible:ring-offset-2";
const BOUTON_PLEIN=cn(BOUTON_ENTETE,"bg-primary text-primary-foreground hover:bg-primary/90");
const BOUTON_CONTOUR=cn(BOUTON_ENTETE,"border-[length:1.5px] border-deep-forest text-deep-forest hover:bg-sable");
function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl">
    <div className="mx-auto grid h-16 max-w-[1360px] grid-cols-[1fr_auto_1fr] items-center px-5 md:h-20 md:px-12">
      <div className="hidden md:block"><Link to="/devenir-artisan" className={ETIQUETTE_ARTISANS}>Espace artisans</Link></div>
      <div className="col-start-1 md:col-start-2"><Logo large/></div>
      <nav className="hidden items-center justify-end gap-3 md:flex"><Link to="/connexion" className={cn(BOUTON_CONTOUR,"w-36")}>Se connecter</Link><Link to="/inscription" className={cn(BOUTON_PLEIN,"w-36")}>S’inscrire</Link></nav>
      <Button variant="ghost" size="icon" className="col-start-3 justify-self-end md:hidden" aria-label={open?"Fermer le menu":"Ouvrir le menu"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</Button>
    </div>
    {open&&<nav className="border-t bg-card px-5 py-4 md:hidden"><div className="grid gap-3"><Link to="/devenir-artisan" className={cn(ETIQUETTE_ARTISANS,"justify-center py-2")}>Espace artisans</Link><Link to="/connexion" className={BOUTON_CONTOUR}>Se connecter</Link><Link to="/inscription" className={BOUTON_PLEIN}>S’inscrire</Link></div></nav>}
  </header>;
}

function MemberHeader() {
 return <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-5 md:h-20 md:px-12"><Logo/><nav className="hidden gap-2 md:flex"><NavLink to="/espace-eleve">Accueil</NavLink><NavLink to="/ateliers">Rechercher</NavLink><NavLink to="/espace-eleve/reservations">Mes réservations</NavLink></nav><div className="flex items-center gap-2"><HeaderBalance/><Button asChild variant="ghost" size="icon"><Link to="/espace-eleve/profil" aria-label="Mon profil"><CircleUserRound/></Link></Button></div></div><nav className="grid grid-cols-3 border-t bg-card md:hidden"><MobileTab to="/espace-eleve" icon={<Sparkles/>}>Accueil</MobileTab><MobileTab to="/ateliers" icon={<Search/>}>Rechercher</MobileTab><MobileTab to="/espace-eleve/reservations" icon={<CalendarDays/>}>Réservations</MobileTab></nav></header>;
}
function HeaderBalance(){const {data,isPending,error}=useQuery(walletQuery);const label=isPending?"…":error?"Solde indisponible":formatCredits(data?.solde_credits??0);
 return <Link to="/espace-eleve/profil" aria-live="polite" aria-label={`Mon solde : ${label}`} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-2 text-xs font-semibold"><Coins className="size-4 text-primary"/>{label}</Link>}
function NavLink({to,children}:{to:string;children:ReactNode}) { return <Link to={to} activeOptions={{exact:to==="/espace-eleve"}} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{className:"bg-muted text-primary font-semibold"}}>{children}</Link> }
function MobileTab({to,icon,children}:{to:string;icon:ReactNode;children:ReactNode}) { return <Link to={to} activeOptions={{exact:to==="/espace-eleve"}} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground [&_svg]:size-4" activeProps={{className:"text-primary font-semibold"}}>{icon}{children}</Link> }

export function ArtisanShell({active,children}:{active:"planning"|"ateliers"|"revenus"|"profil";children:ReactNode}) {
  const navigate=useNavigate();const queryClient=useQueryClient();
  async function logout(){await queryClient.cancelQueries();queryClient.clear();await supabase.auth.signOut();navigate({to:"/artisan/connexion",replace:true});}
 const links=[{id:"planning",to:"/artisan/planning",label:"Mon planning",icon:<CalendarDays/>},{id:"ateliers",to:"/artisan/ateliers",label:"Mes ateliers",icon:<Palette/>},{id:"revenus",to:"/artisan/revenus",label:"Mes revenus",icon:<Euro/>},{id:"profil",to:"/artisan/profil",label:"Mon profil",icon:<CircleUserRound/>}] as const;
 return <div className="min-h-screen bg-background lg:flex"><aside className="hidden w-64 shrink-0 border-r bg-card p-6 lg:flex lg:flex-col"><Logo/><nav className="mt-12 grid gap-2">{links.map(l=><Link key={l.id} to={l.to} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm [&_svg]:size-5",active===l.id?"bg-accent font-semibold text-primary":"text-muted-foreground hover:bg-muted")}>{l.icon}{l.label}</Link>)}</nav><div className="mt-auto grid gap-2 text-sm text-muted-foreground"><a href="mailto:artisans@creazio.fr" className="px-4">Contacter le support</a><button type="button" onClick={logout} className="flex items-center gap-2 px-4 text-left"><LogOut className="size-4"/>Se déconnecter</button></div></aside><div className="min-w-0 flex-1"><header className="flex h-16 items-center justify-between border-b bg-card px-5 lg:justify-end lg:px-10"><div className="lg:hidden"><Logo/></div><Link to="/artisan/profil" className="flex items-center gap-2 text-sm font-semibold"><CircleUserRound className="size-5"/>Mon profil</Link></header><main className="mx-auto max-w-[1360px] p-5 pb-24 md:p-10">{children}</main><nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card lg:hidden">{links.map(l=><MobileTab key={l.id} to={l.to} icon={l.icon}>{l.label}</MobileTab>)}</nav></div></div>
}

export function EmptyState({icon,title,body,action}:{icon:ReactNode;title:string;body:string;action?:ReactNode}) {return <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center"><div className="mb-5 grid size-16 place-items-center rounded-full bg-accent text-primary [&_svg]:size-7">{icon}</div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>{action&&<div className="mt-6">{action}</div>}</div>}
export function PageTitle({eyebrow,title,body,action,niveau="h1",titreId}:{eyebrow?:string;title:string;body?:string;action?:ReactNode;niveau?:"h1"|"h2";titreId?:string}) {const Titre=niveau;return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow&&<p className="label-font mb-2 text-xs font-semibold uppercase text-primary">{eyebrow}</p>}<Titre id={titreId} tabIndex={titreId?-1:undefined} className="text-3xl font-bold text-foreground focus:outline-none md:text-4xl">{title}</Titre>{body&&<p className="mt-2 max-w-2xl text-muted-foreground">{body}</p>}</div>{action}</div>}

function WorkshopCard({w}:{w:typeof workshops[number]}) {return <Link to="/ateliers/$workshopId" params={{workshopId:w.id}} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden"><img src={w.image} alt={w.title} className="size-full object-cover transition duration-500 group-hover:scale-105"/><span className="label-font absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase">{w.category}</span></div><div className="p-4"><h3 className="text-lg font-semibold group-hover:text-primary">{w.title}</h3><p className="mt-1 text-sm text-muted-foreground">{w.artisan} · {w.place}</p><div className="mt-5 flex items-center justify-between text-sm"><span className="flex items-center gap-1 text-muted-foreground"><Clock3 className="size-4"/>{w.duration}</span><span><s className="mr-2 text-muted-foreground">{w.old}</s><strong className="text-primary">{w.credits} crédits</strong></span></div></div></Link>}

export function LandingPage(){const benefits=[{icon:<BadgeCheck/>,title:"Artisans sélectionnés",body:"Des ateliers vérifiés par Creazio"},{icon:<Percent/>,title:"Jusqu’à -40 % de réduction",body:"Tarifs réduits sur de nombreux créneaux"},{icon:<Clock3/>,title:"Réservation en 2 min",body:"Simple et sans engagement"}];return <><PublicHeader/><main><section className="mx-auto grid max-w-[1360px] gap-8 px-5 py-9 md:px-12 md:py-14 lg:grid-cols-2 lg:items-center"><div><h1 className="max-w-2xl text-4xl font-bold leading-tight text-secondary md:text-5xl">L’atelier créatif près de chez vous, à prix doux.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Réservez en quelques clics chez les meilleurs artisans près de chez vous, à des tarifs moins chers.</p><Button asChild size="lg" className="mt-7"><Link to="/connexion">Découvrez les ateliers <ArrowRight/></Link></Button></div><img src={hero} alt="Groupe participant à un atelier de poterie" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"/></section><section className="mx-auto max-w-[1360px] px-5 pb-10 md:px-12"><div className="grid rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-3 md:divide-x">{benefits.map(item=><div key={item.title} className="flex gap-4 p-3"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-primary [&_svg]:size-5"><span aria-hidden="true" className="contents">{item.icon}</span></span><div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-muted-foreground">{item.body}</p></div></div>)}</div></section><section className="mx-auto max-w-[1360px] px-5 pb-14 md:px-12"><div className="rounded-2xl border bg-card p-6"><h2 className="mb-6 text-xl font-bold text-secondary">Les savoir-faire à découvrir</h2><SavoirFaireGrid/></div></section><section className="bg-muted py-14"><div className="mx-auto max-w-[1360px] px-5 md:px-12"><h2 className="text-center text-3xl font-bold text-secondary">Comment ça marche ?</h2><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[["01","Achetez vos crédits Creazio","Choisissez le pack qui vous ressemble, du créatif occasionnel au passionné."],["02","Choisissez votre atelier","Une sélection d’artisans passionnés."],["03","Réservez votre créneau","Des tarifs négociés directement."],["04","Profitez de l’atelier","Un accès simple, sans engagement."]].map(x=><div key={x[0]} className="rounded-2xl bg-card p-6"><span className="label-font rounded-full bg-accent px-3 py-1 text-xs font-bold text-secondary">{x[0]}</span><h3 className="mt-5 font-semibold">{x[1]}</h3><p className="mt-2 text-sm text-muted-foreground">{x[2]}</p></div>)}</div></div></section><section className="mx-auto max-w-[1360px] px-5 py-14 md:px-12"><PageTitle niveau="h2" title="Quelques ateliers à découvrir" body="Connectez-vous pour consulter les prochains créneaux."/><div className="grid gap-6 md:grid-cols-3">{workshops.map(w=><WorkshopCard key={w.id} w={w}/>)}</div></section></main><Footer/></>}
function Footer(){return <footer className="border-t bg-muted"><div className="mx-auto flex max-w-[1360px] flex-col gap-4 px-5 py-8 text-sm md:flex-row md:items-center md:justify-between md:px-12"><strong>Creazio</strong><div className="flex gap-5 text-muted-foreground"><span>CGU</span><span>Confidentialité</span></div></div></footer>}

export function ArtisanLandingPage(){return <><PublicHeader/><main><section className="relative min-h-[560px] overflow-hidden"><img src={leather} alt="Artisane au travail" className="absolute inset-0 size-full object-cover"/><div className="absolute inset-0 bg-foreground/55"/><div className="relative mx-auto flex min-h-[560px] max-w-[1360px] items-center px-5 py-16 md:px-12"><div className="max-w-2xl text-primary-foreground"><p className="label-font text-sm font-semibold uppercase">Artisans partenaires</p><h1 className="mt-4 text-4xl font-bold md:text-6xl">Remplissez vos créneaux creux, sans effort</h1><p className="mt-5 max-w-xl text-lg text-primary-foreground/85">Publiez vos ateliers, choisissez vos remises et accueillez de nouveaux élèves.</p><Button asChild size="lg" className="mt-8"><Link to="/artisan/inscription">Rejoindre Creazio <ArrowRight/></Link></Button><Button asChild size="lg" variant="outline" className="mt-8 ml-3 bg-transparent text-primary-foreground"><Link to="/artisan/connexion">Se connecter</Link></Button></div></div></section><section className="mx-auto grid max-w-[1100px] gap-6 px-5 py-16 md:grid-cols-3"><Stat value="Plus de visibilité" label="Une communauté d’élèves curieux"/><Stat value="Vous décidez" label="Créneaux, capacité et remise"/><Stat value="Suivi simple" label="Planning et revenus centralisés"/></section></main><Footer/></>}
function Stat({value,label}:{value:string;label:string}){return <div className="border-l-2 border-primary pl-5"><strong className="text-xl">{value}</strong><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>}

function AuthPage({artisan=false}:{artisan?:boolean}){
  const navigate=useNavigate();
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setError("");
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error||!data.session){setError(friendlyAuthError(error?.message));setBusy(false);return;}
    const user=data.user;
    if(!user){setError("Connexion impossible. Réessayez.");setBusy(false);return;}
    const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
    const meta=(user.user_metadata??{}) as {role?:string};
    const pending=pendingProfileFromMetadata(user.user_metadata??{},user.email??email);
    if(!profile&&pending){
      try{await ensureProfile(user.id,pending);}
      catch(insertError){setError(friendlyAuthError(insertError instanceof Error?insertError.message:undefined));setBusy(false);return;}
    }
    const role=profile?.role??meta.role;
    if(role!=="artisan")await ensureSignupInterests(user);
    navigate({to:role==="artisan"?"/artisan/planning":"/espace-eleve"});
  }
  return <><PublicHeader/><main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[1100px] items-center px-5 py-12"><div className="mx-auto w-full max-w-md"><Link to={artisan?"/devenir-artisan":"/"} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4"/>Retour</Link><PageTitle eyebrow={artisan?"Espace artisan":"Espace élève"} title="Ravi de vous revoir" body="Connectez-vous pour accéder à votre espace."/><form onSubmit={submit} className="grid gap-5"><Field label="Adresse email"><Input type="email" required autoComplete="email" placeholder="vous@exemple.fr" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Mot de passe"><Input type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/></Field>{error&&<p role="alert" className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">{error}</p>}<Button type="submit" size="lg" disabled={busy}>{busy?"Connexion…":"Se connecter"}</Button></form>{artisan?<p className="mt-6 text-center text-sm text-muted-foreground">Pas encore partenaire ? <Link to="/artisan/inscription" className="font-semibold text-primary">S’inscrire</Link></p>:<p className="mt-6 text-center text-sm text-muted-foreground">Pas encore membre ? <Link to="/inscription" className="font-semibold text-primary">Créer un compte</Link></p>}</div></main></>}
export function ArtisanSignupPage(){
  const navigate=useNavigate();
  const {artisan,setArtisan}=useCreazioSession();
  const [prenom,setPrenom]=useState("");const [nom,setNom]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [error,setError]=useState("");const [info,setInfo]=useState("");const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setError("");setInfo("");
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{role:"artisan",prenom,nom,adresse_ligne:artisan.address.street,code_postal:artisan.address.postcode,ville:artisan.address.city,atelier:artisan.name,categories:artisan.categories}}});
    if(error){setError(friendlyAuthError(error.message));setBusy(false);return;}
    if(data.session&&data.user){
      try{await ensureProfile(data.user.id,{role:"artisan",prenom,nom,email,adresse_ligne:artisan.address.street,code_postal:artisan.address.postcode,ville:artisan.address.city,atelier:artisan.name,categories:artisan.categories});}
      catch(insertError){setError(friendlyAuthError(insertError instanceof Error?insertError.message:undefined));setBusy(false);return;}
      navigate({to:"/artisan/planning"});
    }else{
      setBusy(false);
      setInfo("Compte créé ! Consultez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
    }
  }
  return <><PublicHeader/><main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[1100px] items-center px-5 py-12"><div className="mx-auto w-full max-w-md"><Link to="/devenir-artisan" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4"/>Retour</Link><PageTitle eyebrow="Espace artisan" title="Créer mon compte artisan" body="Créez votre accès, puis complétez votre candidature."/><form onSubmit={submit} className="grid gap-5"><div className="grid grid-cols-2 gap-4"><Field label="Prénom"><Input required autoComplete="given-name" value={prenom} onChange={e=>setPrenom(e.target.value)}/></Field><Field label="Nom"><Input required autoComplete="family-name" value={nom} onChange={e=>setNom(e.target.value)}/></Field></div><Field label="Nom de l’atelier"><Input required placeholder="Atelier Terres Vives" value={artisan.name} onChange={e=>setArtisan({...artisan,name:e.target.value})}/></Field><Field label="Adresse email professionnelle"><Input type="email" required autoComplete="email" placeholder="atelier@exemple.fr" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Mot de passe"><Input type="password" required minLength={8} autoComplete="new-password" placeholder="8 caractères minimum" value={password} onChange={e=>setPassword(e.target.value)}/></Field><ArtisanOnboardingFields/>{error&&<p role="alert" className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">{error}</p>}{info&&<p role="status" className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">{info}</p>}<Button type="submit" size="lg" disabled={busy}>{busy?"Création…":"Créer mon compte"} <ArrowRight/></Button></form><p className="mt-6 text-center text-sm text-muted-foreground">Déjà partenaire ? <Link to="/artisan/connexion" className="font-semibold text-primary">Se connecter</Link></p></div></main></>}
export function StudentLoginPage(){return <AuthPage/>} export function ArtisanLoginPage(){return <AuthPage artisan/>}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="grid gap-2 text-sm font-semibold">{label}{children}</label>}

/** Champ texte avec libellé et message d'erreur relié (aria-describedby). */
function ChampTexte({id,label,error,...props}:{id:string;label:string;error?:string|undefined}&React.ComponentProps<typeof Input>){
  return <div className="grid gap-2"><label htmlFor={id} className="text-sm font-semibold">{label}</label><Input id={id} aria-invalid={Boolean(error)} aria-describedby={error?`${id}-erreur`:undefined} className={cn(error&&"border-destructive")} {...props}/>{error&&<p id={`${id}-erreur`} className="text-sm font-medium text-destructive">{error}</p>}</div>;
}
const focusChamp=(id:string)=>setTimeout(()=>document.getElementById(id)?.focus(),0);

export function SignupPage(){
  const navigate=useNavigate();
  const [step,setStep]=useState<1|2|3>(1);
  const {inspirations,setInspirations,studentAddress,setStudentAddress}=useCreazioSession();
  const [prenom,setPrenom]=useState("");const [nom,setNom]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [adresseSaisie,setAdresseSaisie]=useState(false);
  const [erreursCompte,setErreursCompte]=useState<Partial<Record<ChampCompte,string>>>({});
  const [erreursChoix,setErreursChoix]=useState<ErreursInspirations>({});
  const [consentements,setConsentements]=useState<Consentements>({cguLe:null,newsletterLe:null});
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [pendingEmail,setPendingEmail]=useState("");
  const compte={prenom,nom,email,password,adresse:studentAddress,adresseSaisie};
  // Une erreur affichée disparaît dès que le champ est corrigé.
  const corriger=(champ:ChampCompte)=>setErreursCompte(e=>({...e,[champ]:undefined}));
  function allerA(etape:1|2|3){setStep(etape);window.scrollTo({top:0});focusChamp("inscription-titre");}
  function continuer(e:FormEvent){
    e.preventDefault();
    const erreurs=validerCompte(compte);setErreursCompte(erreurs);
    const premier=premierChampEnErreur(erreurs);
    if(premier){focusChamp(`inscription-${premier}`);return;}
    allerA(2);
  }
  async function createAccount(e:FormEvent){
    e.preventDefault();setError("");
    const choix={inspirations,consentements};
    const erreurs=validerInspirations(choix);setErreursChoix(erreurs);
    if(erreurs.inspirations){focusChamp("inscription-savoir-faire");return;}
    if(erreurs.cgu){focusChamp("inscription-cgu");return;}
    setBusy(true);
    const metadonnees=metadonneesInscription(compte,choix);
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:metadonnees}});
    if(error){
      const message=friendlyAuthError(error.message);setBusy(false);
      if(error.message.includes("already registered")){setErreursCompte({email:message});allerA(1);focusChamp("inscription-email");return;}
      setError(message);return;
    }
    if(data.session&&data.user){
      try{await ensureProfile(data.user.id,{...metadonnees,email:email.trim()});await saveInterests(data.user.id,inspirations);}
      catch(insertError){setError(friendlyAuthError(insertError instanceof Error?insertError.message:undefined));setBusy(false);return;}
      navigate({to:"/espace-eleve"});
    }else{
      setPendingEmail(email.trim());setBusy(false);allerA(3);
    }
  }
  const titre=step===1?"Créons votre compte":step===2?"Qu’est-ce qui vous inspire ?":"Plus qu’une étape : confirmez votre email";
  return <><PublicHeader/><main className="mx-auto max-w-2xl px-5 py-10"><div className="mb-8 flex gap-2" aria-hidden="true">{[1,2,3].map(n=><span key={n} className={cn("h-1.5 flex-1 rounded-full",n<=step?"bg-primary":"bg-muted")}/>)}</div><PageTitle eyebrow={`Étape ${step} sur 3`} title={titre} titreId="inscription-titre"/><div className="rounded-2xl border bg-card p-5 shadow-sm md:p-8">
    {step===1?<form noValidate onSubmit={continuer} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2"><ChampTexte id="inscription-prenom" label="Prénom" autoComplete="given-name" value={prenom} error={erreursCompte.prenom} onChange={e=>{setPrenom(e.target.value);corriger("prenom");}}/><ChampTexte id="inscription-nom" label="Nom" autoComplete="family-name" value={nom} error={erreursCompte.nom} onChange={e=>{setNom(e.target.value);corriger("nom");}}/></div>
      <ChampTexte id="inscription-email" label="Adresse email" type="email" autoComplete="email" value={email} error={erreursCompte.email} onChange={e=>{setEmail(e.target.value);corriger("email");}}/>
      <ChampTexte id="inscription-password" label="Mot de passe (8 caractères minimum)" type="password" autoComplete="new-password" value={password} error={erreursCompte.password} onChange={e=>{setPassword(e.target.value);corriger("password");}}/>
      <AddressAutocomplete id="inscription-adresse" label="Adresse" value={studentAddress} onChange={a=>{setStudentAddress(a);if(a.city)corriger("adresse");}} onTexteChange={t=>setAdresseSaisie(t.trim().length>0)} error={erreursCompte.adresse} hint={<><MapPin className="size-4 shrink-0" aria-hidden="true"/>Elle sert à vous proposer les ateliers proches de chez vous.</>}/>
      <div className="mt-3 flex justify-end"><Button type="submit">Continuer <ArrowRight/></Button></div>
    </form>
    :step===2?<form noValidate onSubmit={createAccount} className="grid gap-6">
      <fieldset aria-describedby={erreursChoix.inspirations?"inscription-savoir-faire-erreur":"inscription-savoir-faire-aide"} className="grid gap-3"><legend className="sr-only">Les savoir-faire qui vous inspirent</legend><p id="inscription-savoir-faire-aide" className="text-sm text-muted-foreground">Choisissez un ou plusieurs savoir-faire : nous vous proposerons les ateliers qui leur correspondent.</p><div id="inscription-savoir-faire" tabIndex={-1} className="rounded-xl focus:outline-none"><CategoryPicker values={inspirations} onChange={v=>{setInspirations(v);if(v.length)setErreursChoix(e=>({...e,inspirations:undefined}));}}/></div>{erreursChoix.inspirations&&<p id="inscription-savoir-faire-erreur" className="text-sm font-medium text-destructive">{erreursChoix.inspirations}</p>}</fieldset>
      <div className="grid gap-4 border-t pt-6">
        <div className="grid gap-1"><label className="flex items-start gap-3 text-sm"><input id="inscription-cgu" type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" checked={Boolean(consentements.cguLe)} aria-invalid={Boolean(erreursChoix.cgu)} aria-describedby={erreursChoix.cgu?"inscription-cgu-erreur":undefined} onChange={e=>{const le=e.target.checked?new Date().toISOString():null;setConsentements(c=>({...c,cguLe:le}));if(le)setErreursChoix(x=>({...x,cgu:undefined}));}}/><span>J’accepte les CGU et la politique de confidentialité <span className="text-muted-foreground">(obligatoire)</span></span></label>{erreursChoix.cgu&&<p id="inscription-cgu-erreur" className="pl-8 text-sm font-medium text-destructive">{erreursChoix.cgu}</p>}</div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" checked={Boolean(consentements.newsletterLe)} onChange={e=>{const le=e.target.checked?new Date().toISOString():null;setConsentements(c=>({...c,newsletterLe:le}));}}/><span>Je souhaite recevoir chaque semaine une sélection d’ateliers près de chez moi <span className="text-muted-foreground">(facultatif)</span></span></label>
      </div>
      {error&&<p role="alert" className="rounded-xl bg-accent p-4 text-sm text-accent-foreground">{error}</p>}
      <div className="flex justify-between gap-3"><Button type="button" variant="outline" onClick={()=>allerA(1)}>Retour</Button><Button type="submit" disabled={busy}>{busy?"Création…":"Créer mon compte"}</Button></div>
    </form>
    :<EmptyState icon={<Check/>} title="Consultez votre boîte mail" body={`Un lien de confirmation vous a été envoyé à ${pendingEmail}. Cliquez dessus, puis connectez-vous.`} action={<Button asChild><Link to="/connexion">Se connecter</Link></Button>}/>}
  </div></main></>}

type DbCard={id:string;titre:string;savoir_faire:string;ville:string;quartier:string|null;duree_minutes:number;photo_url:string|null;distance_km?:number|undefined;prix_min?:number|undefined};
function DbWorkshopCard({w}:{w:DbCard}){return <Link to="/ateliers/$workshopId" params={{workshopId:w.id}} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden bg-muted"><img {...photoAtelier(w.photo_url,w.titre)} className="size-full object-cover transition duration-500 group-hover:scale-105"/><span className="label-font absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase">{labelSavoirFaire(w.savoir_faire)}</span></div><div className="p-4"><h3 className="text-lg font-semibold group-hover:text-primary">{w.titre}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4"/>{w.quartier?`${w.quartier} · `:""}{w.ville}{w.distance_km!=null&&` · ${String(w.distance_km).replace(".",",")} km`}</p><p className="mt-4 flex items-center gap-1 text-sm text-muted-foreground"><Clock3 className="size-4"/>{formatDuree(w.duree_minutes)}{w.prix_min!=null&&<span className="flex items-center gap-1">· <Coins className="size-4"/>{w.prix_min} crédits</span>}</p></div></Link>}

export function WorkshopsPage(){const [query,setQuery]=useState("");const [active,setActive]=useState("Tous");const [tri,setTri]=useState<"pertinence"|"distance"|"budget">("pertinence");const {data,isLoading,error}=useQuery(publishedWorkshopsQuery);
  const profileQuery=useQuery({queryKey:["profil"],queryFn:async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data,error}=await supabase.from("profiles").select("adresse_ligne,code_postal,ville,latitude,longitude").eq("id",user.id).maybeSingle();if(error)throw error;return data;}});
  const profile=profileQuery.data;
  const adresseEleve=profile?.adresse_ligne?`${profile.adresse_ligne}, ${profile.code_postal} ${profile.ville}`:"";
  const list=useMemo(()=>{const q=query.trim().toLowerCase();const enriched=(data??[]).map(w=>({...w,prix_min:w.sessions?.length?Math.min(...w.sessions.map(s=>s.prix_credits)):undefined,distance_km:profile?.latitude!=null&&w.latitude!=null&&w.longitude!=null?distanceKm({lat:Number(profile.latitude),lon:Number(profile.longitude)},{lat:Number(w.latitude),lon:Number(w.longitude)}):undefined})).filter(w=>(active==="Tous"||labelSavoirFaire(w.savoir_faire)===active)&&(!q||`${w.titre} ${w.description} ${w.ville} ${labelSavoirFaire(w.savoir_faire)}`.toLowerCase().includes(q)));if(tri==="distance")enriched.sort((a,b)=>(a.distance_km??Number.POSITIVE_INFINITY)-(b.distance_km??Number.POSITIVE_INFINITY));else if(tri==="budget")enriched.sort((a,b)=>(a.prix_min??Number.POSITIVE_INFINITY)-(b.prix_min??Number.POSITIVE_INFINITY));return enriched;},[data,query,active,tri,profile]);
  return <><MemberHeader/><main className="mx-auto max-w-[1360px] px-5 py-8 md:px-12"><PageTitle title="Trouver un atelier" body="Explorez les savoir-faire autour de vous." action={adresseEleve?<span className="rounded-full bg-muted px-4 py-2 text-xs">{adresseEleve}</span>:null}/><div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-4 top-3.5 size-5 text-muted-foreground"/><Input value={query} onChange={e=>setQuery(e.target.value)} className="pl-11" placeholder="Une activité, un savoir-faire…"/></div><Button variant="outline" size="icon" aria-label="Filtrer"><Filter/></Button></div><div className="mt-5 flex gap-2 overflow-x-auto pb-2">{["Tous",...crafts].map(c=><Button key={c} variant={active===c?"secondary":"outline"} aria-pressed={active===c} onClick={()=>setActive(c)} className="shrink-0 rounded-lg">{c}</Button>)}</div><div className="mt-4 flex items-center gap-2 text-sm"><span className="text-muted-foreground">Trier par :</span><select value={tri} onChange={e=>setTri(e.target.value as typeof tri)} aria-label="Trier les ateliers" className="rounded-lg border bg-background px-3 py-2 text-sm"><option value="pertinence">Pertinence</option><option value="distance">Plus proche de moi</option><option value="budget">Le moins de crédits</option></select></div><div className="mt-8">{isLoading?<p className="text-sm text-muted-foreground">Chargement des ateliers…</p>:error?<EmptyState icon={<Search/>} title="Impossible de charger les ateliers" body="Réessayez dans un instant."/>:list.length?<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map(w=><DbWorkshopCard key={w.id} w={w}/>)}</div>:<EmptyState icon={<Search/>} title="Aucun atelier trouvé" body={data?.length?"Aucun atelier ne correspond à ces filtres.":"Aucun atelier publié pour le moment."} action={<Button variant="outline" onClick={()=>{setQuery("");setActive("Tous")}}>Réinitialiser les filtres</Button>}/>}</div></main></>}

export function WorkshopDetailPage(){const {workshopId}=useParams({strict:false}) as {workshopId?:string};const {data:w,isLoading}=useQuery({...workshopQuery(workshopId??""),enabled:Boolean(workshopId)});
  return <><MemberHeader/><main className="mx-auto max-w-[1200px] px-5 py-8 md:px-12"><Link to="/ateliers" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4"/>Retour aux ateliers</Link>{isLoading?<p className="text-sm text-muted-foreground">Chargement…</p>:!w?<EmptyState icon={<Search/>} title="Atelier introuvable" body="Cet atelier n’est pas ou plus disponible." action={<Button asChild><Link to="/ateliers">Voir les ateliers</Link></Button>}/>:<div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr]"><div><img {...photoAtelier(w.photo_url,w.titre)} className="aspect-[4/3] w-full rounded-2xl object-cover"/><div className="py-7"><span className="label-font text-xs font-semibold uppercase text-primary">{labelSavoirFaire(w.savoir_faire)}</span><h1 className="mt-2 text-3xl font-bold">{w.titre}</h1><p className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin className="size-4"/>{w.adresse_ligne}, {w.code_postal} {w.ville}</p><p className="mt-6 whitespace-pre-line leading-7 text-muted-foreground">{w.description}</p>{w.materiel_inclus&&<p className="mt-4 text-sm"><strong>Matériel inclus :</strong> {w.materiel_inclus}</p>}</div></div><aside className="h-fit rounded-2xl border bg-card p-5 shadow-lg lg:sticky lg:top-24"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4"/>{formatDuree(w.duree_minutes)} · {w.taille_groupe_max} pers. max</p><WorkshopSlots workshopId={w.id}/></aside></div>}</main></>}

export function StudentHomePage(){const {data,isLoading}=useQuery(recommendationsQuery);
  const profileQuery=useQuery({queryKey:["profil"],queryFn:async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data,error}=await supabase.from("profiles").select("prenom,adresse_ligne,code_postal,ville").eq("id",user.id).maybeSingle();if(error)throw error;return data;}});
  const profile=profileQuery.data;
  const adresseEleve=profile?.adresse_ligne?`${profile.adresse_ligne}, ${profile.code_postal} ${profile.ville}`:"";
  return <><MemberHeader/><main className="mx-auto max-w-[1360px] px-5 py-8 md:px-12"><PageTitle title={profile?.prenom?`Bonjour ${profile.prenom}`:"Bonjour"} body="Prêt·e pour une nouvelle découverte créative ?" action={adresseEleve?<span className="rounded-full bg-muted px-4 py-2 text-xs">{adresseEleve}</span>:null}/><section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Vos ateliers recommandés</h2><p className="text-sm text-muted-foreground">À moins de {RAYON_RECOMMANDATION_KM} km de chez vous, selon vos envies.</p></div><Link to="/ateliers" className="text-sm font-semibold text-primary">Tout explorer</Link></div>{isLoading?<p className="text-sm text-muted-foreground">Recherche d’ateliers près de chez vous…</p>:data?.status==="incomplet"?<EmptyState icon={<MapPin/>} title="Complétez votre profil" body="Renseignez votre adresse et ce qui vous inspire pour recevoir des ateliers près de chez vous." action={<Button asChild><Link to="/espace-eleve/profil">Compléter mon profil</Link></Button>}/>:data?.items.length?<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.items.map(w=><DbWorkshopCard key={w.id} w={w}/>)}</div>:<EmptyState icon={<Sparkles/>} title="Pas encore d’atelier près de chez vous" body={`Aucun atelier de vos savoir-faire préférés à moins de ${RAYON_RECOMMANDATION_KM} km pour le moment.`} action={<Button asChild><Link to="/ateliers">Tout explorer</Link></Button>}/>}</section></main></>}
export function ReservationsPage(){
  const {data,isPending,error,refetch}=useQuery(upcomingReservationsQuery);
  const {data:delai=48}=useQuery(delaiAnnulationQuery);
  const [annonce,setAnnonce]=useState("");
  return <><MemberHeader/><main className="mx-auto max-w-[1100px] px-5 py-8 md:px-12"><PageTitle title="Mes réservations" body="Retrouvez vos prochains ateliers et le code à présenter à l’artisan."/>
    {annonce&&<p role="status" className="mb-5 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">{annonce}</p>}
    {isPending?<p role="status" className="text-sm text-muted-foreground">Chargement de vos réservations…</p>
    :error?<div><p role="alert" className="text-sm">{messageErreur(error)}</p><Button variant="outline" className="mt-3" onClick={()=>refetch()}>Réessayer</Button></div>
    :!data.length?<EmptyState icon={<CalendarDays/>} title="Aucune réservation à venir" body="Vos prochains rendez-vous créatifs apparaîtront ici." action={<Button asChild><Link to="/ateliers">Découvrir les ateliers</Link></Button>}/>
    :<ul className="grid gap-4">{data.map(r=><ReservationCard key={r.id} r={r} delai={delai} onCancelled={setAnnonce}/>)}</ul>}
  </main></>}
function ReservationCard({r,delai,onCancelled}:{r:UpcomingReservation;delai:number;onCancelled:(message:string)=>void}){
  const queryClient=useQueryClient();
  const [open,setOpen]=useState(false);
  const atelier=r.sessions.ateliers;
  const annulable=peutAnnuler(r.sessions.debut_le,delai);
  const annulation=useMutation({mutationFn:()=>annulerReservation(r.id),onSuccess:async solde=>{
    queryClient.setQueryData(walletQuery.queryKey,()=>({solde_credits:solde}));
    setOpen(false);
    onCancelled(`Réservation annulée : ${formatCredits(r.credits_debites)} recrédités. Nouveau solde : ${formatCredits(solde)}.`);
    await queryClient.invalidateQueries({queryKey:["reservations"]});
    if(atelier)await queryClient.invalidateQueries({queryKey:["ateliers",atelier.id,"sessions-disponibles"]});
  }});
  const aideId=`annulation-aide-${r.id}`;
  return <li className="rounded-2xl border bg-card p-5 md:flex md:items-start md:justify-between md:gap-6">
    <div><h2 className="text-lg font-semibold">{atelier?.titre??"Atelier"}</h2>{atelier?.artisans?.nom_commercial&&<p className="text-sm text-muted-foreground">avec {atelier.artisans.nom_commercial}</p>}
      <p className="mt-3 flex items-center gap-2 text-sm"><CalendarDays className="size-4 text-primary"/>{formatJour(r.sessions.debut_le)} · {formatHeure(r.sessions.debut_le)} – {formatHeure(r.sessions.fin_le)}</p>
      {atelier&&<p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4"/>{atelier.adresse_ligne}, {atelier.code_postal} {atelier.ville}</p>}
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Coins className="size-4"/>{formatCredits(r.credits_debites)}</p></div>
    <div className="mt-4 flex flex-col gap-3 md:mt-0 md:items-end"><div className="rounded-xl bg-muted px-4 py-2 md:text-right"><p className="text-xs text-muted-foreground">Code à présenter à l’artisan</p><p className="font-mono text-lg font-bold tracking-wider">{r.code_creazio}</p></div>
      <AlertDialog open={open} onOpenChange={o=>{if(!annulation.isPending){setOpen(o);annulation.reset();}}}>
        <AlertDialogTrigger asChild><Button variant="outline" disabled={!annulable} aria-describedby={annulable?undefined:aideId}>Annuler</Button></AlertDialogTrigger>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle><AlertDialogDescription>{atelier?.titre??"Atelier"}, le {formatJour(r.sessions.debut_le).toLowerCase()} à {formatHeure(r.sessions.debut_le)}. Vos {formatCredits(r.credits_debites)} seront recrédités sur votre solde.</AlertDialogDescription></AlertDialogHeader>
          {annulation.error&&<p role="alert" className="rounded-lg bg-muted p-3 text-sm">{messageErreur(annulation.error)}</p>}
          <AlertDialogFooter><AlertDialogCancel disabled={annulation.isPending}>Garder ma réservation</AlertDialogCancel><Button variant="destructive" disabled={annulation.isPending} onClick={()=>annulation.mutate()}>{annulation.isPending?"Annulation en cours…":"Oui, annuler"}</Button></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      {!annulable&&<p id={aideId} className="max-w-[260px] text-xs text-muted-foreground md:text-right">Annulation impossible à moins de {delai} h du début de l’atelier. Pour toute question, écrivez à <a className="underline" href="mailto:support@creazio.fr">support@creazio.fr</a>.</p>}
    </div>
  </li>}
// Packs affichés si la table packs_credits est vide ou injoignable (règle : 1 crédit = 1 €). Non achetables.
export const packs=[{id:"decouverte",tag:"Initiation",name:"Pack Découverte",credits:50,price:50},{id:"regulier",tag:"Recommandé",name:"Pack Régulier",credits:100,price:100,popular:true},{id:"passionne",tag:"Approfondi",name:"Pack Passionné",credits:150,price:150}];
/** Abonnement à la sélection hebdomadaire : la date d'accord est posée par la base (definir_newsletter). */
function NewsletterSwitch({abonneLe,disabled}:{abonneLe:string|null;disabled:boolean}){
  const queryClient=useQueryClient();
  const [message,setMessage]=useState("");
  const maj=useMutation({mutationFn:async(abonne:boolean)=>{const {data,error}=await supabase.rpc("definir_newsletter",{p_abonne:abonne});if(error)throw toReservationError(error);return data;},
    onSuccess:(date)=>{queryClient.setQueryData(["profil"],(p:Record<string,unknown>|null|undefined)=>p?{...p,newsletter_acceptee_le:date}:p);setMessage(date?"C’est noté : vous recevrez la sélection chaque semaine.":"C’est noté : vous ne recevrez plus la sélection.");},
    onError:(e)=>setMessage(messageErreur(e))});
  const abonne=maj.isPending?Boolean(maj.variables):Boolean(abonneLe);
  return <section className="mt-3 grid gap-2 border-t pt-5"><h2 className="text-lg font-semibold">Newsletter</h2><div className="flex items-start justify-between gap-4"><label htmlFor="profil-newsletter" className="text-sm">Recevoir chaque semaine une sélection d’ateliers près de chez moi</label><Switch id="profil-newsletter" checked={abonne} disabled={disabled} aria-busy={maj.isPending} onCheckedChange={v=>{if(maj.isPending)return;setMessage("");maj.mutate(v);}} className="mt-0.5 data-[state=unchecked]:bg-muted-foreground/60"/></div>{message&&<p role="status" className="text-sm text-muted-foreground">{message}</p>}</section>;
}

export function ProfilePage(){
  const {inspirations,setInspirations,studentAddress,setStudentAddress}=useCreazioSession();
  const navigate=useNavigate();
  const queryClient=useQueryClient();
  const [prenom,setPrenom]=useState("");const [nom,setNom]=useState("");
  const [profileMessage,setProfileMessage]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
  const [selectedPackId,setSelectedPackId]=useState<string|null>(null);
  const profileQuery=useQuery({queryKey:["profil"],queryFn:async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data,error}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();if(error)throw error;return data;}});
  const wallet=useQuery(walletQuery);
  const packsQuery=useQuery({queryKey:["packs_credits"],queryFn:async()=>{const {data,error}=await supabase.from("packs_credits").select("id,prix_eur,nombre_credits").eq("actif",true).order("prix_eur");if(error)throw error;return data;}});
  const profile=profileQuery.data;
  useEffect(()=>{if(profile){setPrenom(profile.prenom);setNom(profile.nom);
    if(!studentAddress.street&&profile.adresse_ligne)setStudentAddress({...studentAddress,street:profile.adresse_ligne??"",postcode:profile.code_postal??"",city:profile.ville??""});
    supabase.from("profil_savoirs_faire").select("savoir_faire").eq("profile_id",profile.id).then(({data})=>{if(data?.length)setInspirations(data.map(r=>labelSavoirFaire(r.savoir_faire)));});
  }},[profile]);// eslint-disable-line react-hooks/exhaustive-deps
  const availablePacks=useMemo(()=>{
    const rows=packsQuery.data;
    if(!rows||rows.length===0)return packs;
    const names=["Découverte","Régulier","Passionné"];const tags=["Initiation","Recommandé","Approfondi"];
    return rows.map((p,i)=>{const pos=rows.length===3?i:-1;
      return {id:p.id,credits:p.nombre_credits,price:Number(p.prix_eur),name:pos>=0?`Pack ${names[pos]}`:`Pack ${p.nombre_credits} crédits`,tag:pos>=0?tags[pos]:"Pack",popular:pos===1};});
  },[packsQuery.data]);
  useEffect(()=>{if(packsQuery.data&&!(selectedPackId&&availablePacks.some(p=>p.id===selectedPackId))){const popular=availablePacks.find(p=>p.popular)??availablePacks[0];if(popular)setSelectedPackId(popular.id);}},[packsQuery.data,availablePacks,selectedPackId]);
  const sel=availablePacks.find(p=>p.id===selectedPackId)??availablePacks[0]??{id:"",credits:100,price:100};
  const solde=wallet.data?.solde_credits??0;
  const packsAchetables=Boolean(packsQuery.data?.length);
  const achat=useMutation({mutationFn:(pack:{id:string;credits:number})=>acheterPackDemo(pack.id),onSuccess:(nouveauSolde,pack)=>{
    queryClient.setQueryData(walletQuery.queryKey,()=>({solde_credits:nouveauSolde}));
    setMsg(`Achat confirmé : ${formatCredits(pack.credits)} ajoutés. Nouveau solde : ${formatCredits(nouveauSolde)}.`);
  }});
  async function saveProfile(){
    setBusy(true);
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setBusy(false);return;}
    const geo=await geocodeAddress(studentAddress.street,studentAddress.postcode,studentAddress.city);
    const {error}=await supabase.from("profiles").update({prenom,nom,adresse_ligne:studentAddress.street,code_postal:studentAddress.postcode,ville:studentAddress.city,latitude:geo?.latitude??null,longitude:geo?.longitude??null}).eq("id",user.id);
    if(!error)await saveInterests(user.id,inspirations);
    await queryClient.invalidateQueries({queryKey:["ateliers","recommandes"]});
    setBusy(false);
    if(error){setProfileMessage(friendlyAuthError(error.message));}else{setProfileMessage("Votre profil a été enregistré.");await queryClient.invalidateQueries({queryKey:["profil"]});}
  }
  async function logout(){
    await queryClient.cancelQueries();queryClient.clear();
    await supabase.auth.signOut();
    navigate({to:"/connexion",replace:true});
  }
  return <><MemberHeader/><main className="mx-auto max-w-[1100px] px-5 py-8 md:px-12"><PageTitle title="Mon profil et mes crédits"/><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border bg-card p-6"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-full bg-secondary text-xl font-bold text-secondary-foreground">{(prenom||profile?.email||"C").charAt(0).toUpperCase()}</div><div><h2 className="font-semibold">Votre profil</h2><p className="text-sm text-muted-foreground">Informations à compléter</p></div></div><div className="mt-6 grid gap-4"><div className="grid grid-cols-2 gap-4"><Field label="Prénom"><Input value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Prénom"/></Field><Field label="Nom"><Input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom"/></Field></div><Field label="Email"><Input type="email" value={profile?.email??""} disabled readOnly/></Field><AddressFields value={studentAddress} onChange={setStudentAddress}/><h2 className="mt-3 text-lg font-semibold">Ce qui m’inspire</h2><CategoryPicker values={inspirations} onChange={setInspirations}/><Button variant="outline" onClick={saveProfile} disabled={busy}>Enregistrer</Button>{profileMessage&&<p role="status" className="text-sm text-muted-foreground">{profileMessage}</p>}<NewsletterSwitch abonneLe={profile?.newsletter_acceptee_le??null} disabled={!profile}/><Button variant="ghost" onClick={logout} className="text-muted-foreground"><LogOut/>Me déconnecter</Button></div></section><div className="grid gap-6 content-start"><section className="rounded-2xl bg-secondary p-6 text-secondary-foreground"><Coins className="size-7"/><p className="mt-4 text-sm opacity-80">Solde disponible</p><strong className="text-4xl">{solde} {solde>1?"crédits":"crédit"}</strong><p className="mt-2 text-sm opacity-80">Valables 12 mois sur tous les ateliers.</p></section><section className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-semibold">Recharger mes crédits</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{availablePacks.map(p=><button key={p.id} type="button" onClick={()=>{setSelectedPackId(p.id);setMsg("");achat.reset()}} aria-pressed={selectedPackId===p.id} className={cn("relative flex flex-col rounded-xl border-2 p-4 text-left transition active:scale-[.98]",selectedPackId===p.id?"border-primary bg-accent":"border-border hover:border-primary/50")}>{p.popular&&<span className="label-font absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">Populaire</span>}<span className="label-font text-[10px] font-semibold uppercase text-muted-foreground">{p.tag}</span><span className="mt-1 text-sm font-semibold">{p.name}</span><strong className="mt-3 text-3xl text-primary">{p.credits}</strong><span className="text-xs text-muted-foreground">crédits · {p.price} € TTC</span><span className={cn("mt-3 inline-flex items-center gap-1 text-xs font-semibold",selectedPackId===p.id?"text-primary":"text-muted-foreground")}>{selectedPackId===p.id?<><Check className="size-3.5"/>Sélectionné</>:"Choisir ce pack"}</span></button>)}</div><div className="mt-6 rounded-xl bg-muted p-4"><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><WalletCards className="size-4 text-primary"/>Pack sélectionné : {sel.credits} crédits</span><strong>{sel.price},00 €</strong></div></div><ul className="mt-4 grid gap-2 text-sm"><li className="flex items-start gap-2"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary"/><span><strong>Mode démonstration :</strong> aucun paiement réel.</span></li><li className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-primary"/><span>Crédits valables 12 mois à compter de l’achat.</span></li></ul><Button className="mt-5 w-full" size="lg" disabled={achat.isPending||!packsAchetables} onClick={()=>{setMsg("");achat.mutate(sel)}}>{achat.isPending?"Achat en cours…":`Payer ${sel.price} € et créditer mon compte`}</Button>{!packsQuery.isPending&&!packsAchetables&&<p role="alert" className="mt-3 rounded-xl bg-muted p-3 text-sm">{packsQuery.error?"Impossible de charger les packs de crédits. Vérifiez votre connexion et rechargez la page.":"Aucun pack de crédits n’est disponible pour le moment."}</p>}{msg&&<p role="status" className="mt-3 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{msg}</p>}{achat.error&&<p role="alert" className="mt-3 rounded-xl bg-muted p-3 text-sm">{messageErreur(achat.error)}</p>}<p className="mt-3 text-center text-xs text-muted-foreground">Paiement unique, sans engagement ni abonnement.</p></section></div></div></main></>}
export function ConfirmationPage(){
  const {reservation:id}=useSearch({strict:false}) as {reservation?:string};
  const {data:r,isPending,error,refetch}=useQuery({...reservationQuery(id??""),enabled:Boolean(id)});
  const {data:wallet}=useQuery(walletQuery);
  const {data:delai=48}=useQuery(delaiAnnulationQuery);
  const atelier=r?.sessions?.ateliers;
  return <><MemberHeader/><main className="mx-auto max-w-xl px-5 py-16">
    {!id?<EmptyState icon={<CalendarDays/>} title="Aucune réservation à afficher" body="Retrouvez toutes vos réservations dans « Mes réservations »." action={<Button asChild><Link to="/espace-eleve/reservations">Voir mes réservations</Link></Button>}/>
    :isPending?<p role="status" className="text-center text-sm text-muted-foreground">Chargement de votre réservation…</p>
    :error?<div className="text-center"><p role="alert" className="text-sm">{messageErreur(error)}</p><Button variant="outline" className="mt-3" onClick={()=>refetch()}>Réessayer</Button></div>
    :!r||!r.sessions||r.statut!=="confirmee"?<EmptyState icon={<CalendarDays/>} title="Réservation introuvable" body="Elle a peut-être été annulée. Retrouvez vos réservations à venir dans « Mes réservations »." action={<Button asChild><Link to="/espace-eleve/reservations">Voir mes réservations</Link></Button>}/>
    :<div className="text-center"><div className="mx-auto grid size-20 place-items-center rounded-full bg-secondary text-secondary-foreground"><Check className="size-9"/></div><h1 className="mt-6 text-3xl font-bold">Réservation confirmée</h1><p className="mt-3 text-muted-foreground">Un récapitulatif reste disponible dans « Mes réservations ».</p>
      <div className="mt-8 rounded-2xl border bg-card p-5 text-left"><p className="text-lg font-semibold">{atelier?.titre??"Atelier"}</p>{atelier?.artisans?.nom_commercial&&<p className="text-sm text-muted-foreground">avec {atelier.artisans.nom_commercial}</p>}
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex gap-2"><CalendarDays className="size-4 shrink-0 text-primary"/><dt className="sr-only">Date</dt><dd>{formatJour(r.sessions.debut_le)} · {formatHeure(r.sessions.debut_le)} – {formatHeure(r.sessions.fin_le)}</dd></div>
          {atelier&&<div className="flex gap-2"><MapPin className="size-4 shrink-0 text-primary"/><dt className="sr-only">Adresse</dt><dd>{atelier.adresse_ligne}, {atelier.code_postal} {atelier.ville}</dd></div>}
          <div className="flex gap-2"><Coins className="size-4 shrink-0 text-primary"/><dt className="sr-only">Crédits</dt><dd>{formatCredits(r.credits_debites)} débités{wallet&&<> · nouveau solde : <strong>{formatCredits(wallet.solde_credits)}</strong></>}</dd></div>
        </dl>
        <div className="mt-5 rounded-xl bg-muted p-4 text-center"><p className="text-sm text-muted-foreground">Votre code Creazio, à présenter à l’artisan</p><p className="mt-1 font-mono text-3xl font-bold tracking-widest text-primary">{r.code_creazio}</p></div>
        <p className="mt-4 text-xs text-muted-foreground">Arrivez 10 minutes avant le début. Annulation gratuite jusqu’à {delai} h avant l’atelier, depuis « Mes réservations ».</p></div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link to="/espace-eleve/reservations">Voir mes réservations</Link></Button><Button asChild variant="outline"><Link to="/ateliers">Découvrir d’autres ateliers</Link></Button></div></div>}
  </main></>}

export function ArtisanApplicationPage(){const [done,setDone]=useState(false);return <><PublicHeader/><main className="mx-auto max-w-3xl px-5 py-10"><Link to="/devenir-artisan" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4"/>Retour</Link><PageTitle eyebrow="Artisans partenaires" title="Votre candidature" body="Présentez-nous votre atelier en quelques minutes."/>{done?<EmptyState icon={<Check/>} title="Formulaire validé" body="Votre candidature n’a pas été enregistrée : elle le sera lorsque votre projet Supabase sera raccordé." action={<Button asChild><Link to="/devenir-artisan">Retour à la présentation</Link></Button>}/>:<form onSubmit={e=>{e.preventDefault();setDone(true)}} className="grid gap-8 rounded-2xl border bg-card p-5 shadow-sm md:p-8"><FormSection number="1" title="Vous et votre atelier"><div className="grid gap-4 md:grid-cols-2"><Field label="Prénom"><Input required/></Field><Field label="Nom"><Input required/></Field></div><Field label="Nom de l’atelier"><Input required/></Field><Field label="Adresse email professionnelle"><Input type="email" required/></Field></FormSection><ArtisanOnboardingFields/><Button type="submit" size="lg">Envoyer ma candidature <ArrowRight/></Button></form>}</main></>}
function FormSection({number,title,children}:{number:string;title:string;children:ReactNode}){return <section className="grid gap-5"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full border border-primary text-sm font-bold text-primary">{number}</span><h2 className="text-lg font-semibold">{title}</h2></div>{children}</section>}

export { ArtisanWorkshopsPage, ArtisanPlanningPage, ArtisanSessionPage } from "./workshop-pages";
export function ArtisanRevenuePage(){return <ArtisanShell active="revenus"><PageTitle title="Mes revenus" body="Suivez vos réservations et vos versements."/><div className="grid gap-4 sm:grid-cols-3"><Kpi icon={<Euro/>} label="Revenus ce mois" value="0 €"/><Kpi icon={<WalletCards/>} label="À recevoir" value="0 €"/><Kpi icon={<Users/>} label="Participants" value="0"/></div><section className="mt-8 rounded-2xl border bg-card p-6"><h2 className="font-semibold">Historique des versements</h2><EmptyState icon={<Euro/>} title="Aucun versement" body="L’historique apparaîtra après les premières réservations."/></section></ArtisanShell>}
function Kpi({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className="rounded-2xl border bg-card p-5"><span className="text-primary [&_svg]:size-5">{icon}</span><p className="mt-5 text-sm text-muted-foreground">{label}</p><strong className="text-2xl">{value}</strong></div>}
