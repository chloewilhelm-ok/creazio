# Modèles des emails d'authentification

Copies des modèles collés dans Supabase (Authentication → Emails → Templates). Supabase envoie ces emails
via le SMTP de Resend : expéditeur `Creazio <bonjour@creazio.fr>`, hôte `smtp.resend.com`, port 465.

| Fichier | Modèle Supabase | Objet |
|---|---|---|
| `confirmation.html` | Confirm sign up | Confirmez votre adresse email – Creazio |
| `recovery.html` | Reset password | Réinitialisez votre mot de passe – Creazio |

Les variables entre accolades sont remplies par Supabase à l'envoi : `{{ .ConfirmationURL }}` (lien),
`{{ .Email }}` (adresse de l'élève) et `{{ .Data.prenom }}` (prénom saisi à l'inscription). L'aperçu du
tableau de bord les affiche telles quelles : c'est normal.

Pour modifier un email : changer le fichier ici, puis recoller son contenu et son objet dans Supabase.
L'email de réservation, lui, est construit par l'Edge Function
`supabase/functions/envoyer-confirmation-reservation/email.ts`.
