import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface SuggestionAtelier {
  atelier_id: string;
  titre: string;
  artisan: string | null;
  savoir_faire: string;
  lieu: string;
  duree_minutes: number;
  prix_min_credits: number;
  prochaine_session: string;
  photo_url: string | null;
  raison: string;
}
export interface ReponseTrouverAtelier {
  suggestions: SuggestionAtelier[];
  message: string;
  restantes: number;
}

const MESSAGES: Record<string, string> = {
  QUOTA: "Vous avez fait 10 demandes cette heure-ci. Réessayez un peu plus tard, ou explorez tous les ateliers.",
  IA_SATUREE: "L’assistant reçoit beaucoup de demandes. Réessayez dans une minute.",
  IA_INDISPONIBLE: "L’assistant est momentanément indisponible. Réessayez dans quelques minutes, ou explorez tous les ateliers.",
  PHRASE_VIDE: "Décrivez votre envie en quelques mots.",
  NON_CONNECTE: "Votre session a expiré. Reconnectez-vous pour utiliser l’assistant.",
  ROLE_INTERDIT: "L’assistant est réservé aux comptes élèves.",
};
export const MESSAGE_IA_PAR_DEFAUT = "Une erreur est survenue. Vérifiez votre connexion et réessayez.";
export const messageIA = (code: string | undefined) => (code && MESSAGES[code]) || MESSAGE_IA_PAR_DEFAUT;

export class ErreurIA extends Error {
  constructor(public code: string | undefined) {
    super(messageIA(code));
  }
}

/** Appelle l'Edge Function trouver-atelier ; les erreurs deviennent des messages lisibles. */
export async function trouverAtelier(phrase: string): Promise<ReponseTrouverAtelier> {
  const { data, error } = await supabase.functions.invoke<ReponseTrouverAtelier>("trouver-atelier", { body: { phrase } });
  if (error) {
    let code: string | undefined;
    if (error instanceof FunctionsHttpError) {
      code = ((await (error.context as Response).json().catch(() => ({}))) as { code?: string }).code;
    }
    throw new ErreurIA(code);
  }
  if (!data) throw new ErreurIA(undefined);
  return data;
}
