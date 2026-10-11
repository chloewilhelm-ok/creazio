export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achats_credits: {
        Row: {
          achete_le: string
          commission_eur: number
          conserver_jusqu_au: string
          eleve_id: string | null
          id: string
          montant_paye_eur: number
          nombre_credits: number
          pack_id: string
          reference_paiement: string | null
          statut_paiement: Database["public"]["Enums"]["statut_paiement"]
          taux_commission: number
        }
        Insert: {
          achete_le?: string
          commission_eur: number
          conserver_jusqu_au: string
          eleve_id?: string | null
          id?: string
          montant_paye_eur: number
          nombre_credits: number
          pack_id: string
          reference_paiement?: string | null
          statut_paiement?: Database["public"]["Enums"]["statut_paiement"]
          taux_commission: number
        }
        Update: {
          achete_le?: string
          commission_eur?: number
          conserver_jusqu_au?: string
          eleve_id?: string | null
          id?: string
          montant_paye_eur?: number
          nombre_credits?: number
          pack_id?: string
          reference_paiement?: string | null
          statut_paiement?: Database["public"]["Enums"]["statut_paiement"]
          taux_commission?: number
        }
        Relationships: [
          {
            foreignKeyName: "achats_credits_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achats_credits_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      artisans: {
        Row: {
          adresse_ligne: string
          candidature_validee_le: string | null
          code_postal: string
          contrat_signe_le: string | null
          cree_le: string
          nom_commercial: string
          profile_id: string
          savoir_faire_principal: Database["public"]["Enums"]["savoir_faire"]
          statut_candidature: Database["public"]["Enums"]["statut_candidature"]
          ville: string
        }
        Insert: {
          adresse_ligne: string
          candidature_validee_le?: string | null
          code_postal: string
          contrat_signe_le?: string | null
          cree_le?: string
          nom_commercial: string
          profile_id: string
          savoir_faire_principal: Database["public"]["Enums"]["savoir_faire"]
          statut_candidature?: Database["public"]["Enums"]["statut_candidature"]
          ville: string
        }
        Update: {
          adresse_ligne?: string
          candidature_validee_le?: string | null
          code_postal?: string
          contrat_signe_le?: string | null
          cree_le?: string
          nom_commercial?: string
          profile_id?: string
          savoir_faire_principal?: Database["public"]["Enums"]["savoir_faire"]
          statut_candidature?: Database["public"]["Enums"]["statut_candidature"]
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ateliers: {
        Row: {
          adresse_ligne: string
          archive_le: string | null
          arrondissement: number | null
          artisan_id: string
          code_postal: string
          cree_le: string
          description: string
          duree_minutes: number
          id: string
          informations_pratiques: string | null
          informations_recuperation_pieces: string | null
          latitude: number | null
          longitude: number | null
          materiel_inclus: string | null
          photo_url: string | null
          prix_public_eur: number
          prix_public_verifie_le: string | null
          quartier: string | null
          savoir_faire: Database["public"]["Enums"]["savoir_faire"]
          statut: Database["public"]["Enums"]["statut_atelier"]
          taille_groupe_max: number
          titre: string
          ville: string
        }
        Insert: {
          adresse_ligne: string
          archive_le?: string | null
          arrondissement?: number | null
          artisan_id: string
          code_postal: string
          cree_le?: string
          description: string
          duree_minutes: number
          id?: string
          informations_pratiques?: string | null
          informations_recuperation_pieces?: string | null
          latitude?: number | null
          longitude?: number | null
          materiel_inclus?: string | null
          photo_url?: string | null
          prix_public_eur: number
          prix_public_verifie_le?: string | null
          quartier?: string | null
          savoir_faire: Database["public"]["Enums"]["savoir_faire"]
          statut?: Database["public"]["Enums"]["statut_atelier"]
          taille_groupe_max: number
          titre: string
          ville: string
        }
        Update: {
          adresse_ligne?: string
          archive_le?: string | null
          arrondissement?: number | null
          artisan_id?: string
          code_postal?: string
          cree_le?: string
          description?: string
          duree_minutes?: number
          id?: string
          informations_pratiques?: string | null
          informations_recuperation_pieces?: string | null
          latitude?: number | null
          longitude?: number | null
          materiel_inclus?: string | null
          photo_url?: string | null
          prix_public_eur?: number
          prix_public_verifie_le?: string | null
          quartier?: string | null
          savoir_faire?: Database["public"]["Enums"]["savoir_faire"]
          statut?: Database["public"]["Enums"]["statut_atelier"]
          taille_groupe_max?: number
          titre?: string
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "ateliers_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      lots_credits: {
        Row: {
          achat_id: string
          credits_initiaux: number
          credits_restants: number
          cree_le: string
          eleve_id: string | null
          expire_le: string
          id: string
        }
        Insert: {
          achat_id: string
          credits_initiaux: number
          credits_restants: number
          cree_le?: string
          eleve_id?: string | null
          expire_le: string
          id?: string
        }
        Update: {
          achat_id?: string
          credits_initiaux?: number
          credits_restants?: number
          cree_le?: string
          eleve_id?: string | null
          expire_le?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_credits_achat_id_fkey"
            columns: ["achat_id"]
            isOneToOne: true
            referencedRelation: "achats_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_credits_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_credits: {
        Row: {
          credits: number
          cree_le: string
          id: string
          litige_id: string | null
          lot_id: string
          reservation_id: string | null
          type_mouvement: Database["public"]["Enums"]["type_mouvement_credit"]
        }
        Insert: {
          credits: number
          cree_le?: string
          id?: string
          litige_id?: string | null
          lot_id: string
          reservation_id?: string | null
          type_mouvement: Database["public"]["Enums"]["type_mouvement_credit"]
        }
        Update: {
          credits?: number
          cree_le?: string
          id?: string
          litige_id?: string | null
          lot_id?: string
          reservation_id?: string | null
          type_mouvement?: Database["public"]["Enums"]["type_mouvement_credit"]
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_credits_litige_id_fkey"
            columns: ["litige_id"]
            isOneToOne: false
            referencedRelation: "signalements_litiges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_credits_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_credits_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      packs_credits: {
        Row: {
          actif: boolean
          id: string
          nombre_credits: number
          prix_eur: number
        }
        Insert: {
          actif?: boolean
          id?: string
          nombre_credits: number
          prix_eur: number
        }
        Update: {
          actif?: boolean
          id?: string
          nombre_credits?: number
          prix_eur?: number
        }
        Relationships: []
      }
      parametres_plateforme: {
        Row: {
          delai_annulation_gratuite_heures: number
          delai_reclamation_jours: number
          duree_conservation_traces_achat_annees: number
          id: number
          mis_a_jour_le: string
          remise_max_pct: number
          remise_min_pct: number
          taux_commission: number
          validite_credits_mois: number
        }
        Insert: {
          delai_annulation_gratuite_heures?: number
          delai_reclamation_jours?: number
          duree_conservation_traces_achat_annees?: number
          id?: number
          mis_a_jour_le?: string
          remise_max_pct?: number
          remise_min_pct?: number
          taux_commission?: number
          validite_credits_mois?: number
        }
        Update: {
          delai_annulation_gratuite_heures?: number
          delai_reclamation_jours?: number
          duree_conservation_traces_achat_annees?: number
          id?: number
          mis_a_jour_le?: string
          remise_max_pct?: number
          remise_min_pct?: number
          taux_commission?: number
          validite_credits_mois?: number
        }
        Relationships: []
      }
      portefeuilles: {
        Row: {
          eleve_id: string
          mis_a_jour_le: string
          solde_credits: number
        }
        Insert: {
          eleve_id: string
          mis_a_jour_le?: string
          solde_credits?: number
        }
        Update: {
          eleve_id?: string
          mis_a_jour_le?: string
          solde_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "portefeuilles_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profil_savoirs_faire: {
        Row: {
          profile_id: string
          savoir_faire: Database["public"]["Enums"]["savoir_faire"]
        }
        Insert: {
          profile_id: string
          savoir_faire: Database["public"]["Enums"]["savoir_faire"]
        }
        Update: {
          profile_id?: string
          savoir_faire?: Database["public"]["Enums"]["savoir_faire"]
        }
        Relationships: [
          {
            foreignKeyName: "profil_savoirs_faire_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          adresse_ligne: string | null
          cgu_acceptees_le: string
          code_postal: string | null
          confidentialite_acceptee_le: string
          cree_le: string
          date_naissance: string | null
          email: string
          id: string
          latitude: number | null
          longitude: number | null
          nom: string
          prenom: string
          role: Database["public"]["Enums"]["role_utilisateur"]
          suppression_demandee_le: string | null
          ville: string | null
        }
        Insert: {
          adresse_ligne?: string | null
          cgu_acceptees_le: string
          code_postal?: string | null
          confidentialite_acceptee_le: string
          cree_le?: string
          date_naissance?: string | null
          email: string
          id: string
          latitude?: number | null
          longitude?: number | null
          nom: string
          prenom: string
          role: Database["public"]["Enums"]["role_utilisateur"]
          suppression_demandee_le?: string | null
          ville?: string | null
        }
        Update: {
          adresse_ligne?: string | null
          cgu_acceptees_le?: string
          code_postal?: string | null
          confidentialite_acceptee_le?: string
          cree_le?: string
          date_naissance?: string | null
          email?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom?: string
          prenom?: string
          role?: Database["public"]["Enums"]["role_utilisateur"]
          suppression_demandee_le?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      recurrences_sessions: {
        Row: {
          atelier_id: string
          date_debut: string
          date_fin: string
          heure_debut: string
          id: string
          jour_semaine: Database["public"]["Enums"]["jour_semaine"]
          places_ouvertes_creazio: number
          places_totales: number
          remise_pct: number
        }
        Insert: {
          atelier_id: string
          date_debut: string
          date_fin: string
          heure_debut: string
          id?: string
          jour_semaine: Database["public"]["Enums"]["jour_semaine"]
          places_ouvertes_creazio: number
          places_totales: number
          remise_pct: number
        }
        Update: {
          atelier_id?: string
          date_debut?: string
          date_fin?: string
          heure_debut?: string
          id?: string
          jour_semaine?: Database["public"]["Enums"]["jour_semaine"]
          places_ouvertes_creazio?: number
          places_totales?: number
          remise_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurrences_sessions_atelier_id_fkey"
            columns: ["atelier_id"]
            isOneToOne: false
            referencedRelation: "ateliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          annulee_le: string | null
          code_creazio: string
          credits_debites: number
          eleve_id: string | null
          id: string
          montant_artisan_eur: number
          rappel_envoye_le: string | null
          reservee_le: string
          session_id: string
          statut: Database["public"]["Enums"]["statut_reservation"]
          versement_id: string | null
        }
        Insert: {
          annulee_le?: string | null
          code_creazio: string
          credits_debites: number
          eleve_id?: string | null
          id?: string
          montant_artisan_eur: number
          rappel_envoye_le?: string | null
          reservee_le?: string
          session_id: string
          statut?: Database["public"]["Enums"]["statut_reservation"]
          versement_id?: string | null
        }
        Update: {
          annulee_le?: string | null
          code_creazio?: string
          credits_debites?: number
          eleve_id?: string | null
          id?: string
          montant_artisan_eur?: number
          rappel_envoye_le?: string | null
          reservee_le?: string
          session_id?: string
          statut?: Database["public"]["Enums"]["statut_reservation"]
          versement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_versement_id_fkey"
            columns: ["versement_id"]
            isOneToOne: false
            referencedRelation: "versements_artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          annulee_le: string | null
          atelier_id: string
          debut_le: string
          fin_le: string
          id: string
          places_ouvertes_creazio: number
          places_restantes: number
          places_totales: number
          prix_credits: number
          recurrence_id: string | null
          remise_pct: number
          statut: Database["public"]["Enums"]["statut_session"]
        }
        Insert: {
          annulee_le?: string | null
          atelier_id: string
          debut_le: string
          fin_le: string
          id?: string
          places_ouvertes_creazio: number
          places_restantes: number
          places_totales: number
          prix_credits: number
          recurrence_id?: string | null
          remise_pct: number
          statut?: Database["public"]["Enums"]["statut_session"]
        }
        Update: {
          annulee_le?: string | null
          atelier_id?: string
          debut_le?: string
          fin_le?: string
          id?: string
          places_ouvertes_creazio?: number
          places_restantes?: number
          places_totales?: number
          prix_credits?: number
          recurrence_id?: string | null
          remise_pct?: number
          statut?: Database["public"]["Enums"]["statut_session"]
        }
        Relationships: [
          {
            foreignKeyName: "sessions_atelier_id_fkey"
            columns: ["atelier_id"]
            isOneToOne: false
            referencedRelation: "ateliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "recurrences_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      signalements_litiges: {
        Row: {
          credits_recredites: number
          decision_le: string | null
          decision_note: string | null
          id: string
          motif: string
          reservation_id: string
          signale_le: string
          signale_par_eleve_id: string | null
          statut: Database["public"]["Enums"]["statut_litige"]
        }
        Insert: {
          credits_recredites?: number
          decision_le?: string | null
          decision_note?: string | null
          id?: string
          motif: string
          reservation_id: string
          signale_le?: string
          signale_par_eleve_id?: string | null
          statut?: Database["public"]["Enums"]["statut_litige"]
        }
        Update: {
          credits_recredites?: number
          decision_le?: string | null
          decision_note?: string | null
          id?: string
          motif?: string
          reservation_id?: string
          signale_le?: string
          signale_par_eleve_id?: string | null
          statut?: Database["public"]["Enums"]["statut_litige"]
        }
        Relationships: [
          {
            foreignKeyName: "signalements_litiges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signalements_litiges_signale_par_eleve_id_fkey"
            columns: ["signale_par_eleve_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      versements_artisans: {
        Row: {
          artisan_id: string
          cree_le: string
          id: string
          montant_eur: number
          reference_virement: string | null
          virement_effectue_le: string
        }
        Insert: {
          artisan_id: string
          cree_le?: string
          id?: string
          montant_eur: number
          reference_virement?: string | null
          virement_effectue_le: string
        }
        Update: {
          artisan_id?: string
          cree_le?: string
          id?: string
          montant_eur?: number
          reference_virement?: string | null
          virement_effectue_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "versements_artisans_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      jour_semaine:
        | "lundi"
        | "mardi"
        | "mercredi"
        | "jeudi"
        | "vendredi"
        | "samedi"
        | "dimanche"
      role_utilisateur: "eleve" | "artisan"
      savoir_faire:
        | "poterie_ceramique"
        | "textile"
        | "bois"
        | "vegetal"
        | "papier"
        | "cosmetique_bien_etre"
        | "bijouterie"
        | "metal"
        | "cuir"
        | "verre"
        | "pierre"
        | "agriculture"
        | "a_manger"
        | "a_boire"
      statut_atelier: "en_verification" | "publie" | "archive"
      statut_candidature: "en_attente" | "validee" | "refusee"
      statut_litige: "ouvert" | "clos_cliente_recreditee" | "clos_sans_suite"
      statut_paiement: "en_attente" | "reussi" | "echoue"
      statut_reservation:
        | "confirmee"
        | "annulee_cliente"
        | "annulee_session"
        | "annulee_place_indisponible"
      statut_session: "ouverte" | "annulee"
      type_mouvement_credit:
        | "achat"
        | "debit_reservation"
        | "recredit_annulation_cliente"
        | "recredit_session_annulee"
        | "recredit_place_indisponible"
        | "recredit_litige"
        | "expiration"
        | "remboursement_suppression_compte"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      jour_semaine: [
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
      ],
      role_utilisateur: ["eleve", "artisan"],
      savoir_faire: [
        "poterie_ceramique",
        "textile",
        "bois",
        "vegetal",
        "papier",
        "cosmetique_bien_etre",
        "bijouterie",
        "metal",
        "cuir",
        "verre",
        "pierre",
        "agriculture",
        "a_manger",
        "a_boire",
      ],
      statut_atelier: ["en_verification", "publie", "archive"],
      statut_candidature: ["en_attente", "validee", "refusee"],
      statut_litige: ["ouvert", "clos_cliente_recreditee", "clos_sans_suite"],
      statut_paiement: ["en_attente", "reussi", "echoue"],
      statut_reservation: [
        "confirmee",
        "annulee_cliente",
        "annulee_session",
        "annulee_place_indisponible",
      ],
      statut_session: ["ouverte", "annulee"],
      type_mouvement_credit: [
        "achat",
        "debit_reservation",
        "recredit_annulation_cliente",
        "recredit_session_annulee",
        "recredit_place_indisponible",
        "recredit_litige",
        "expiration",
        "remboursement_suppression_compte",
      ],
    },
  },
} as const
