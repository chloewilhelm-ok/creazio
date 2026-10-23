-- Catalogue de démo : 10 artisans fictifs (un savoir-faire chacun) et leur atelier publié.
-- Inspiré des ateliers Wecandoo à Paris. Comptes créés confirmés, sans mot de passe utilisable
-- (catalogue seulement) ; emails en @creazio.fr, aucun email envoyé.
-- Le trigger handle_new_user crée profil, fiche artisan et centres d'intérêt ; les récurrences
-- génèrent les sessions datées (prive.generer_sessions_atelier) et sessions_preparer calcule le prix en crédits.
-- Rejouable : un email déjà présent est ignoré.
DO $$
DECLARE
  a jsonb;
  v_user uuid;
  v_atelier uuid;
BEGIN
  FOR a IN SELECT * FROM jsonb_array_elements($json$[
    {"prenom":"Léa","nom":"Morel","email":"lea.morel.demo@creazio.fr","atelier":"Atelier Sillage","categorie":"Bijouterie","sf":"bijouterie",
     "adresse":"48 Rue Oberkampf","cp":"75011","arr":11,"quartier":"Oberkampf","lat":48.8650,"lon":2.3730,
     "titre":"Créez votre bague en argent","duree":180,"groupe":6,"prix":75,
     "description":"Dans son atelier d'Oberkampf, Léa vous initie aux gestes du bijoutier : mise en forme du fil d'argent, soudure au chalumeau, martelage et polissage. Vous repartez avec une bague unique, ajustée à votre doigt. Aucune expérience n'est nécessaire.",
     "materiel":"Argent 925, outils de bijoutier, chalumeau, lunettes de protection et tablier.",
     "pratique":"Atelier au fond de la cour, interphone « Sillage ». Cheveux longs attachés, ongles courts conseillés.",
     "recuperation":"Votre bague est polie sur place : vous repartez avec à la fin de l'atelier.",
     "creneaux":[{"jour":"jeudi","heure":"19:00","remise":30,"places":3},{"jour":"samedi","heure":"14:00","remise":20,"places":2}]},
    {"prenom":"Hugo","nom":"Lambert","email":"hugo.lambert.demo@creazio.fr","atelier":"Maison Fauve","categorie":"Cuir","sf":"cuir",
     "adresse":"62 Rue du Faubourg Saint-Denis","cp":"75010","arr":10,"quartier":"Faubourg Saint-Denis","lat":48.8725,"lon":2.3540,
     "titre":"Porte-cartes en cuir cousu main","duree":150,"groupe":6,"prix":55,
     "description":"Hugo, maroquinier formé chez un sellier parisien, vous apprend à tracer, couper, teindre les tranches et coudre au point sellier. Vous choisissez la couleur de votre cuir et repartez avec un porte-cartes personnalisé à vos initiales.",
     "materiel":"Cuir de veau tanné végétal, fil ciré, aiguilles, griffes à frapper et outils de marquage.",
     "pratique":"Boutique-atelier au rez-de-chaussée, sonnez à la porte vitrée. Accessible en fauteuil roulant.",
     "recuperation":"Vous repartez avec votre porte-cartes terminé.",
     "creneaux":[{"jour":"mardi","heure":"19:00","remise":40,"places":3},{"jour":"dimanche","heure":"10:30","remise":20,"places":2}]},
    {"prenom":"Inès","nom":"Garnier","email":"ines.garnier.demo@creazio.fr","atelier":"Fil & Trame","categorie":"Textile","sf":"textile",
     "adresse":"25 Rue Ramponeau","cp":"75020","arr":20,"quartier":"Belleville","lat":48.8712,"lon":2.3803,
     "titre":"Initiation au tissage sur métier","duree":180,"groupe":8,"prix":60,
     "description":"Découvrez le tissage mural sur un petit métier à cadre : montage de la chaîne, choix des laines, points de base et franges. Inès vous accompagne pas à pas pour créer une pièce décorative à accrocher chez vous.",
     "materiel":"Métier à tisser prêté pendant l'atelier, laines, cotons, aiguilles et baguette en bois pour l'accroche.",
     "pratique":"Atelier au 1er étage sans ascenseur. Thé et biscuits offerts.",
     "recuperation":"Vous repartez avec votre tissage monté sur sa baguette.",
     "creneaux":[{"jour":"mercredi","heure":"19:00","remise":30,"places":4},{"jour":"samedi","heure":"10:00","remise":20,"places":3}]},
    {"prenom":"Thomas","nom":"Roux","email":"thomas.roux.demo@creazio.fr","atelier":"L'Établi du Canal","categorie":"Bois","sf":"bois",
     "adresse":"14 Quai de la Loire","cp":"75019","arr":19,"quartier":"Bassin de la Villette","lat":48.8862,"lon":2.3727,
     "titre":"Sculptez votre cuillère en bois","duree":180,"groupe":6,"prix":65,
     "description":"Au bord du bassin de la Villette, Thomas vous apprend à travailler le bois vert au couteau et à la gouge pour sculpter une cuillère de cuisine. Une initiation à la sculpture traditionnelle, accessible à tous.",
     "materiel":"Bois de tilleul ou de bouleau, couteaux de sculpture, gouges, gants anti-coupure et huile alimentaire de finition.",
     "pratique":"Prévoir une tenue qui ne craint pas les copeaux. Atelier ouvert sur la cour, chauffé en hiver.",
     "recuperation":"Vous repartez avec votre cuillère huilée, prête à l'emploi après 48 h de séchage.",
     "creneaux":[{"jour":"vendredi","heure":"18:30","remise":40,"places":3},{"jour":"dimanche","heure":"14:00","remise":20,"places":2}]},
    {"prenom":"Manon","nom":"Petit","email":"manon.petit.demo@creazio.fr","atelier":"Serre Urbaine","categorie":"Végétal","sf":"vegetal",
     "adresse":"8 Rue des Abbesses","cp":"75018","arr":18,"quartier":"Montmartre","lat":48.8846,"lon":2.3383,
     "titre":"Composez votre terrarium","duree":120,"groupe":8,"prix":45,
     "description":"Manon, paysagiste, vous guide dans la création d'un mini-jardin sous verre : choix des plantes, couches de drainage, mousses et décor. Vous apprenez aussi à l'entretenir pour qu'il dure des années.",
     "materiel":"Bocal en verre, plantes, terreau, billes d'argile, mousses, sable décoratif et outils de plantation.",
     "pratique":"Boutique en rez-de-chaussée, à deux minutes du métro Abbesses.",
     "recuperation":"Vous repartez avec votre terrarium et une fiche d'entretien.",
     "creneaux":[{"jour":"jeudi","heure":"19:30","remise":30,"places":4},{"jour":"samedi","heure":"11:00","remise":20,"places":4}]},
    {"prenom":"Julien","nom":"Faure","email":"julien.faure.demo@creazio.fr","atelier":"Presse & Papier","categorie":"Papier","sf":"papier",
     "adresse":"17 Rue de Saintonge","cp":"75003","arr":3,"quartier":"Haut-Marais","lat":48.8622,"lon":2.3637,
     "titre":"Reliure japonaise d'un carnet","duree":150,"groupe":8,"prix":50,
     "description":"Julien, relieur, vous fait découvrir la reliure japonaise : choix des papiers, pliage des cahiers, perçage et couture apparente. Vous repartez avec un carnet de 80 pages à la couverture de votre choix.",
     "materiel":"Papiers d'art, papier intérieur 120 g, fil de lin, poinçons, aiguilles et plioirs en os.",
     "pratique":"Atelier sur cour, porte verte au fond à gauche.",
     "recuperation":"Vous repartez avec votre carnet terminé.",
     "creneaux":[{"jour":"mardi","heure":"18:30","remise":30,"places":4},{"jour":"dimanche","heure":"15:00","remise":20,"places":3}]},
    {"prenom":"Sarah","nom":"Benali","email":"sarah.benali.demo@creazio.fr","atelier":"Cire & Savon","categorie":"Bien-être","sf":"cosmetique_bien_etre",
     "adresse":"40 Rue des Martyrs","cp":"75009","arr":9,"quartier":"South Pigalle","lat":48.8800,"lon":2.3399,
     "titre":"Bougies parfumées naturelles","duree":120,"groupe":8,"prix":45,
     "description":"Sarah vous apprend à créer deux bougies à la cire de soja : choix de la mèche, assemblage des huiles essentielles, coulage et décoration. Un atelier sensoriel pour composer votre propre parfum d'intérieur.",
     "materiel":"Cire de soja, mèches en coton, huiles essentielles, contenants en verre et étiquettes personnalisables.",
     "pratique":"Atelier au rez-de-chaussée. Signalez-nous toute allergie aux huiles essentielles avant l'atelier.",
     "recuperation":"Les bougies doivent refroidir 1 h : vous repartez avec en fin d'atelier, couvercle fermé.",
     "creneaux":[{"jour":"mercredi","heure":"19:00","remise":40,"places":4},{"jour":"samedi","heure":"16:00","remise":20,"places":3}]},
    {"prenom":"Claire","nom":"Dubois","email":"claire.dubois.demo@creazio.fr","atelier":"Atelier Lumen","categorie":"Verre","sf":"verre",
     "adresse":"11 Rue Didot","cp":"75014","arr":14,"quartier":"Pernety","lat":48.8335,"lon":2.3166,
     "titre":"Initiation au vitrail","duree":180,"groupe":6,"prix":70,
     "description":"Claire, maître verrière, vous initie à la technique Tiffany : découpe du verre, rodage, sertissage au ruban de cuivre et soudure à l'étain. Vous réalisez un petit vitrail suspendu qui jouera avec la lumière de votre fenêtre.",
     "materiel":"Verres colorés, coupe-verre, rodeuse, ruban de cuivre, étain, fer à souder, gants et lunettes de protection.",
     "pratique":"Chaussures fermées obligatoires. Atelier au fond de l'impasse, rez-de-chaussée.",
     "recuperation":"Votre vitrail est nettoyé et patiné sur place : vous repartez avec.",
     "creneaux":[{"jour":"lundi","heure":"19:00","remise":30,"places":3},{"jour":"samedi","heure":"14:30","remise":20,"places":2}]},
    {"prenom":"Karim","nom":"Haddad","email":"karim.haddad.demo@creazio.fr","atelier":"Le Fournil Partagé","categorie":"À manger","sf":"a_manger",
     "adresse":"6 Rue d'Aligre","cp":"75012","arr":12,"quartier":"Aligre","lat":48.8492,"lon":2.3780,
     "titre":"Pain au levain et viennoiseries","duree":180,"groupe":8,"prix":60,
     "description":"Dans son fournil près du marché d'Aligre, Karim partage ses secrets de boulanger : rafraîchir un levain, pétrir, façonner, puis préparer une pâte feuilletée pour vos croissants. Dégustation à la sortie du four.",
     "materiel":"Farines bio, levain, beurre AOP, tabliers et boîtes pour emporter vos pains et viennoiseries.",
     "pratique":"Signalez toute allergie (gluten, lait) au moment de la réservation. Fournil au rez-de-chaussée.",
     "recuperation":"Vous repartez avec votre pain, vos viennoiseries et un pot de levain.",
     "creneaux":[{"jour":"vendredi","heure":"18:30","remise":30,"places":4},{"jour":"dimanche","heure":"09:30","remise":20,"places":3}]},
    {"prenom":"Antoine","nom":"Mercier","email":"antoine.mercier.demo@creazio.fr","atelier":"La Petite Brasserie","categorie":"À boire","sf":"a_boire",
     "adresse":"18 Rue de la Butte aux Cailles","cp":"75013","arr":13,"quartier":"Butte-aux-Cailles","lat":48.8277,"lon":2.3497,
     "titre":"Brassez votre bière artisanale","duree":180,"groupe":8,"prix":65,
     "description":"Antoine, brasseur indépendant, vous fait réaliser un brassin complet : empâtage, filtration, ébullition et houblonnage. Vous découvrez les styles de bière et dégustez ses créations. Réservé aux plus de 18 ans.",
     "materiel":"Malts, houblons, levures, matériel de brassage, bouteilles et capsules.",
     "pratique":"Atelier réservé aux personnes majeures, pièce d'identité demandée. À consommer avec modération.",
     "recuperation":"Votre bière fermente 3 semaines : vous récupérez vos bouteilles à l'atelier, ou elles vous sont déposées sur rendez-vous.",
     "creneaux":[{"jour":"jeudi","heure":"19:00","remise":30,"places":4},{"jour":"samedi","heure":"15:00","remise":20,"places":3}]}
  ]$json$::jsonb)
  LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM auth.users u WHERE u.email = a->>'email');
    v_user := gen_random_uuid();

    -- Compte confirmé sans mot de passe utilisable ; handle_new_user crée profil, fiche artisan et savoir-faire
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', v_user, 'authenticated', 'authenticated', a->>'email', '', now(),
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', 'artisan', 'prenom', a->>'prenom', 'nom', a->>'nom', 'atelier', a->>'atelier',
        'adresse_ligne', a->>'adresse', 'code_postal', a->>'cp', 'ville', 'Paris', 'categories', jsonb_build_array(a->>'categorie')),
      now(), now());
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user, v_user::text, 'email',
      jsonb_build_object('sub', v_user::text, 'email', a->>'email', 'email_verified', true), now(), now());

    UPDATE public.profiles SET latitude = (a->>'lat')::numeric, longitude = (a->>'lon')::numeric WHERE id = v_user;
    UPDATE public.artisans SET statut_candidature = 'validee', candidature_validee_le = now(), contrat_signe_le = now(),
      savoir_faire_principal = (a->>'sf')::public.savoir_faire
    WHERE profile_id = v_user;

    -- Atelier publié, prix public vérifié par Creazio, photo par défaut (photo_url NULL)
    INSERT INTO public.ateliers (artisan_id, titre, description, savoir_faire, adresse_ligne, code_postal, ville,
      arrondissement, quartier, latitude, longitude, duree_minutes, taille_groupe_max, prix_public_eur,
      prix_public_verifie_le, materiel_inclus, informations_pratiques, informations_recuperation_pieces, statut)
    VALUES (v_user, a->>'titre', a->>'description', (a->>'sf')::public.savoir_faire, a->>'adresse', a->>'cp', 'Paris',
      (a->>'arr')::int, a->>'quartier', (a->>'lat')::numeric, (a->>'lon')::numeric, (a->>'duree')::int, (a->>'groupe')::int,
      (a->>'prix')::numeric, now(), a->>'materiel', a->>'pratique', a->>'recuperation', 'publie')
    RETURNING id INTO v_atelier;

    -- Deux créneaux hebdomadaires jusqu'à fin décembre : les sessions datées sont générées par trigger
    INSERT INTO public.recurrences_sessions (atelier_id, jour_semaine, heure_debut, date_debut, date_fin,
      places_totales, places_ouvertes_creazio, remise_pct)
    SELECT v_atelier, (c->>'jour')::public.jour_semaine, (c->>'heure')::time, current_date, date '2026-12-31',
      (a->>'groupe')::int, (c->>'places')::int, (c->>'remise')::numeric
    FROM jsonb_array_elements(a->'creneaux') c;
  END LOOP;
END $$;
