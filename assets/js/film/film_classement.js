/*fichier JS de film_classement.html*/
const CLE_SELECTION_FILMS = "film_selection";
const CLE_CLASSEMENT_FILMS = "film_classement_complet";

const elementProgression = document.querySelector(".position_1");
const imageGauche = document.getElementById("image_gauche");
const imageDroite = document.getElementById("image_droite");
const nomGauche = document.getElementById("nom_gauche");
const nomDroite = document.getElementById("nom_droite");
const boutonGauche = document.getElementById("bouton_gauche");
const boutonDroit = document.getElementById("bouton_droit");
const boutonMenu = document.querySelector(".bouton_menu");
const boutonArreter = document.getElementById("bouton_arreter");

let selection = [];
let classement = [];
let groupes = [];
let fusions = [];
let groupesSuivants = [];
let fusionActive = null;
let comparerFin = false;
let duel = [];
let dernierDuel = [];
let comparaisons = 0;
let termine = false;

const normaliserNomFilm = (nomFichier) => {
    const dernierPoint = nomFichier.lastIndexOf(".");
    const base = dernierPoint > 0 ? nomFichier.slice(0, dernierPoint) : nomFichier;
    return base.replace(/_/g, " ");
};

const afficherEtatVide = (message) => {
    if (imageGauche) {
        imageGauche.removeAttribute("src");
        imageGauche.alt = "Aucune affiche";
    }

    if (imageDroite) {
        imageDroite.removeAttribute("src");
        imageDroite.alt = "Aucune affiche";
    }

    if (nomGauche) {
        nomGauche.textContent = message;
    }

    if (nomDroite) {
        nomDroite.textContent = "";
    }

    if (elementProgression) {
        elementProgression.textContent = "0/0";
    }

    if (boutonGauche) {
        boutonGauche.disabled = true;
    }

    if (boutonDroit) {
        boutonDroit.disabled = true;
    }
};

const afficherComparaison = () => {
    if (duel.length !== 2 || termine) {
        return;
    }

    const [filmEnCours, filmClasse] = duel;

    if (imageGauche) {
        imageGauche.src = `../../module/film/affiche/${encodeURIComponent(filmEnCours)}`;
        imageGauche.alt = `Affiche du film ${normaliserNomFilm(filmEnCours)}`;
    }

    if (imageDroite) {
        imageDroite.src = `../../module/film/affiche/${encodeURIComponent(filmClasse)}`;
        imageDroite.alt = `Affiche du film ${normaliserNomFilm(filmClasse)}`;
    }

    if (nomGauche) {
        nomGauche.textContent = normaliserNomFilm(filmEnCours);
    }

    if (nomDroite) {
        nomDroite.textContent = normaliserNomFilm(filmClasse);
    }

    if (elementProgression) {
        elementProgression.textContent = `${comparaisons} duels`;
    }

    if (boutonGauche) {
        boutonGauche.disabled = false;
    }

    if (boutonDroit) {
        boutonDroit.disabled = false;
    }
};

const finaliserClassement = () => {
    termine = true;
    if (boutonGauche) boutonGauche.disabled = true;
    if (boutonDroit) boutonDroit.disabled = true;
    sessionStorage.setItem(CLE_CLASSEMENT_FILMS, JSON.stringify(classement));
    window.location.href = "film_resultats_classement.html";
};

// Chaque groupe est déjà trié du préféré au moins apprécié.
const commencerPasse = () => {
    fusions = [];
    groupesSuivants = [];
    for (let i = 0; i < groupes.length; i += 2) {
        if (!groupes[i + 1]) {
            groupesSuivants.push(groupes[i]);
        } else {
            fusions.push({ gauche: [...groupes[i]], droite: [...groupes[i + 1]], debut: [], fin: [] });
        }
    }
};

const proposerDuel = () => {
    if (!fusions.length) {
        groupes = groupesSuivants;
        if (groupes.length === 1) {
            classement = groupes[0];
            finaliserClassement();
            return;
        }
        commencerPasse();
    }

    // Varier les groupes, puis comparer leurs meilleurs ou leurs derniers films.
    // Privilégier un duel sans affiche du duel précédent quand il existe.
    let meilleur = null;
    for (const fusion of fusions) {
        for (const fin of [false, true]) {
            const paire = [fusion.gauche[fin ? fusion.gauche.length - 1 : 0],
                fusion.droite[fin ? fusion.droite.length - 1 : 0]];
            const repetitions = paire.filter(film => dernierDuel.includes(film)).length;
            if (!meilleur || repetitions < meilleur.repetitions) {
                meilleur = { fusion, fin, paire, repetitions };
            }
        }
    }
    fusionActive = meilleur.fusion;
    comparerFin = meilleur.fin;
    duel = meilleur.paire;
    afficherComparaison();
};

const choisirFilm = (cote) => {
    if (termine || !fusionActive) return;
    const gaucheGagne = cote === "gauche";
    dernierDuel = [...duel];
    comparaisons += 1;

    // En tête, extraire le gagnant ; en queue, extraire le perdant.
    const groupe = (comparerFin ? !gaucheGagne : gaucheGagne)
        ? fusionActive.gauche : fusionActive.droite;
    if (comparerFin) fusionActive.fin.push(groupe.pop());
    else fusionActive.debut.push(groupe.shift());

    fusions.splice(fusions.indexOf(fusionActive), 1);
    if (!fusionActive.gauche.length || !fusionActive.droite.length) {
        groupesSuivants.push([
            ...fusionActive.debut, ...fusionActive.gauche, ...fusionActive.droite,
            ...fusionActive.fin.reverse()
        ]);
    } else {
        fusions.push(fusionActive);
    }
    proposerDuel();
};

const abandonnerClassement = () => {
    termine = true;
    sessionStorage.removeItem(CLE_CLASSEMENT_FILMS);
    window.location.href = "film_menu.html";
};

const initialiser = () => {
    sessionStorage.removeItem(CLE_CLASSEMENT_FILMS);
    const selectionBrute = sessionStorage.getItem(CLE_SELECTION_FILMS);

    try {
        selection = JSON.parse(selectionBrute ?? "[]");
    } catch (_error) {
        selection = [];
    }

    if (!Array.isArray(selection) || !selection.every(film => typeof film === "string" && film.trim())) {
        selection = [];
    }
    selection = [...new Set(selection)];
    if (selection.length < 3) {
        afficherEtatVide("Sélection insuffisante");
        return;
    }

    groupes = selection.map(film => [film]);
    commencerPasse();
    proposerDuel();
};

if (boutonGauche) {
    boutonGauche.addEventListener("click", () => choisirFilm("gauche"));
}

if (boutonDroit) {
    boutonDroit.addEventListener("click", () => choisirFilm("droite"));
}

if (boutonMenu) {
    boutonMenu.addEventListener("click", abandonnerClassement);
}

if (boutonArreter) {
    boutonArreter.addEventListener("click", abandonnerClassement);
}

initialiser();
