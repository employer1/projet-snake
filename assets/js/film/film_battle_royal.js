/*fichier JS de film_battle_royal.html*/
const CLE_SELECTION_FILMS = "film_selection";
const CLE_TOP3_BATTLE_ROYAL = "film_top3_battle_royal";

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
let participants = [];
let gagnants = [];
let perdants = [];
let indexPaire = 0;
let numeroTour = 0;
let phase = "tour";
let duel = [];
let finalistes = [];
let troisieme = "";
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

    const [filmGauche, filmDroit] = duel;

    if (imageGauche) {
        imageGauche.src = `../../module/film/affiche/${encodeURIComponent(filmGauche)}`;
        imageGauche.alt = `Affiche du film ${normaliserNomFilm(filmGauche)}`;
    }

    if (imageDroite) {
        imageDroite.src = `../../module/film/affiche/${encodeURIComponent(filmDroit)}`;
        imageDroite.alt = `Affiche du film ${normaliserNomFilm(filmDroit)}`;
    }

    if (nomGauche) {
        nomGauche.textContent = normaliserNomFilm(filmGauche);
    }

    if (nomDroite) {
        nomDroite.textContent = normaliserNomFilm(filmDroit);
    }

    if (elementProgression) {
        const nombreDuels = Math.ceil(participants.length / 2);
        elementProgression.textContent = phase === "petite_finale" ? "3e place"
            : phase === "finale" ? "Finale"
            : `Tour ${numeroTour} · ${indexPaire + 1}/${nombreDuels}`;
    }

    if (boutonGauche) {
        boutonGauche.disabled = false;
    }

    if (boutonDroit) {
        boutonDroit.disabled = false;
    }
};

const finaliserClassement = (premier, deuxieme) => {
    termine = true;
    if (boutonGauche) boutonGauche.disabled = true;
    if (boutonDroit) boutonDroit.disabled = true;
    const top3 = [premier, deuxieme, troisieme];
    sessionStorage.setItem(CLE_TOP3_BATTLE_ROYAL, JSON.stringify(top3));
    window.location.href = "film_resultats_battle_royal.html";
};

const commencerTour = (films) => {
    participants = [...films];
    gagnants = [];
    perdants = [];
    indexPaire = 0;
    numeroTour += 1;
    phase = "tour";
    duel = participants.slice(0, 2);
    afficherComparaison();
};

const terminerTour = () => {
    if (gagnants.length === 2) {
        finalistes = [...gagnants];
        phase = "petite_finale";
        duel = [...perdants];
        afficherComparaison();
    } else {
        commencerTour(gagnants);
    }
};

const choisirFilm = (cote) => {
    if (termine || duel.length !== 2) return;
    const indexGagnant = cote === "gauche" ? 0 : 1;
    const gagnant = duel[indexGagnant];
    const perdant = duel[1 - indexGagnant];

    if (phase === "finale") {
        finaliserClassement(gagnant, perdant);
        return;
    }
    if (phase === "petite_finale") {
        troisieme = gagnant;
        phase = "finale";
        duel = [...finalistes];
        afficherComparaison();
        return;
    }

    // À trois, le film isolé affronte le gagnant du seul duel : c'est la finale.
    if (participants.length === 3) {
        troisieme = perdant;
        phase = "finale";
        duel = [gagnant, participants[2]];
        afficherComparaison();
        return;
    }

    if (phase === "duel_impair") {
        // Le duel supplémentaire remplace la qualification du premier gagnant.
        gagnants[0] = gagnant;
        perdants[0] = perdant;
        terminerTour();
        return;
    }

    gagnants.push(gagnant);
    perdants.push(perdant);
    indexPaire += 1;
    if (indexPaire < Math.floor(participants.length / 2)) {
        duel = participants.slice(indexPaire * 2, indexPaire * 2 + 2);
        afficherComparaison();
    } else if (participants.length % 2 !== 0) {
        phase = "duel_impair";
        duel = [gagnants[0], participants[participants.length - 1]];
        afficherComparaison();
    } else {
        terminerTour();
    }
};

const abandonnerClassement = () => {
    sessionStorage.removeItem(CLE_TOP3_BATTLE_ROYAL);
    window.location.href = "film_menu.html";
};

const initialiser = () => {
    sessionStorage.removeItem(CLE_TOP3_BATTLE_ROYAL);
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

    commencerTour(selection);
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
