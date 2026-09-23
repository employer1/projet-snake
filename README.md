# projet-snake
ce putain de projet de merde. Il est aussi a chier que le reste de ce monde

Pour exécuter le projet. Ouvrir le CMD de l'ordinateur et se diriger dans
"C:\Users\theot\WebstormProjects\projet-snake"
ou dans
"C:\Users\theo\WebstormProjects\projet-snake" sur mon portable.
Exécutez "npx electron .".

Vérifier si les modifications s'appliquent quand même avec "npm start" depuis le terminal de WebStorm.

J'ai ajouté un gitignore à la racine pour ignorer le fichier /node_modules/electron/dist/electron.exe afin de ne plus importer electron.exe car il dépasse les 100Mo. Maintenant, si j'importe le projet sur une nouvelle machine, il faudra refaire "npm install" pour recréer l'environnement node_modules.

## Arborescence des dossiers

```text
projet-snake/
├─ assets/
│  ├─ css/
│  │  ├─ dactylo/
│  │  ├─ daily-note/
│  │  ├─ film/
│  │  └─ quest/
│  └─ js/
│     ├─ dactylo/
│     ├─ daily-note/
│     ├─ film/
│     └─ quest/
├─ fonts/
├─ image/
├─ module/
│  ├─ dactylo/
│  ├─ daily_note/
│  │  └─ notes/
│  ├─ film/
│  │  ├─ affiche/
│  │  └─ classement/
│  └─ quest/
│     ├─ img/
│     │  ├─ img_acteur/
│     │  ├─ img_animaux_terrestre/
│     │  ├─ img_belgique/
│     │  ├─ img_bien_etre_pictogramme/
│     │  ├─ img_celebrite/
│     │  ├─ img_chaine_de_montagne/
│     │  ├─ img_continent/
│     │  ├─ img_cuisson_viande/
│     │  ├─ img_drapeau/
│     │  ├─ img_forme/
│     │  ├─ img_hunter_x_hunter/
│     │  ├─ img_livre_permis_conduire/
│     │  ├─ img_map_mario_kart/
│     │  ├─ img_mer/
│     │  ├─ img_personnage_avatar/
│     │  ├─ img_personnage_beastars/
│     │  ├─ img_personnage_breaking_bad/
│     │  ├─ img_personnage_euphoria/
│     │  ├─ img_personnage_game_of_thrones/
│     │  ├─ img_personnage_the_walking_dead/
│     │  ├─ img_personnage_zootopie/
│     │  └─ img_race_de_chien/
│     ├─ questionnaire/
│     │  ├─ autre/
│     │  ├─ cours/
│     │  ├─ creer/
│     │  │  ├─ langue/
│     │  │  ├─ qcm/
│     │  │  └─ txt/
│     │  ├─ culture/
│     │  │  └─ cinema/
│     │  │     └─ personnages/
│     │  ├─ geographie/
│     │  └─ langue/
│     │     ├─ anglais/
│     │     ├─ espagnol/
│     │     └─ francais/
│     └─ stat/
├─ pages/
│  ├─ dactylo/
│  ├─ daily-note/
│  ├─ film/
│  └─ quest/
└─ temp/
   ├─ cours/
   │  ├─ img_bien_etre/
   │  └─ programmation/
   │     └─ C/
   │        ├─ img_enumeration/
   │        ├─ img_examen/
   │        ├─ img_pointeur/
   │        └─ img_structure/
   └─ langues/
      └─ anglais/
```
