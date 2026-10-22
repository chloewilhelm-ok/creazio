-- Le code de réservation CRZ-XXXXXX fait 10 caractères : la colonne passe de 8 à 12.
ALTER TABLE public.reservations ALTER COLUMN code_creazio TYPE varchar(12);
