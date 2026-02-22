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
let indexFilm = 0;
let indexComparaison = 0;
let filmEnCours = "";

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
    if (!filmEnCours || indexComparaison < 0 || indexComparaison >= classement.length) {
        return;
    }

    const filmClasse = classement[indexComparaison];

    if (imageGauche) {
        imageGauche.src = `../film/affiche/${encodeURIComponent(filmEnCours)}`;
        imageGauche.alt = `Affiche du film ${normaliserNomFilm(filmEnCours)}`;
    }

    if (imageDroite) {
        imageDroite.src = `../film/affiche/${encodeURIComponent(filmClasse)}`;
        imageDroite.alt = `Affiche du film ${normaliserNomFilm(filmClasse)}`;
    }

    if (nomGauche) {
        nomGauche.textContent = normaliserNomFilm(filmEnCours);
    }

    if (nomDroite) {
        nomDroite.textContent = normaliserNomFilm(filmClasse);
    }

    if (elementProgression) {
        elementProgression.textContent = `${classement.length + 1}/${selection.length}`;
    }

    if (boutonGauche) {
        boutonGauche.disabled = false;
    }

    if (boutonDroit) {
        boutonDroit.disabled = false;
    }
};

const finaliserClassement = () => {
    sessionStorage.setItem(CLE_CLASSEMENT_FILMS, JSON.stringify(classement));
    window.location.href = "../pages/film_resultats_classement.html";
};

const avancerInsertion = (filmGagnant) => {
    if (filmGagnant === "gauche") {
        indexComparaison -= 1;

        if (indexComparaison < 0) {
            classement.unshift(filmEnCours);
            passerAuFilmSuivant();
            return;
        }

        afficherComparaison();
        return;
    }

    indexComparaison += 1;

    if (indexComparaison >= classement.length) {
        classement.push(filmEnCours);
        passerAuFilmSuivant();
        return;
    }

    afficherComparaison();
};

const passerAuFilmSuivant = () => {
    indexFilm += 1;

    if (indexFilm >= selection.length) {
        finaliserClassement();
        return;
    }

    filmEnCours = selection[indexFilm];
    indexComparaison = 0;
    afficherComparaison();
};

const abandonnerClassement = () => {
    sessionStorage.removeItem(CLE_CLASSEMENT_FILMS);
    window.location.href = "../pages/film_menu.html";
};

const initialiser = () => {
    const selectionBrute = sessionStorage.getItem(CLE_SELECTION_FILMS);

    try {
        selection = JSON.parse(selectionBrute ?? "[]");
    } catch (_error) {
        selection = [];
    }

    if (!Array.isArray(selection) || selection.length < 3) {
        afficherEtatVide("Sélection insuffisante");
        return;
    }

    classement = [selection[0]];
    filmEnCours = selection[1];
    indexFilm = 1;
    indexComparaison = 0;

    afficherComparaison();
};

if (boutonGauche) {
    boutonGauche.addEventListener("click", () => avancerInsertion("gauche"));
}

if (boutonDroit) {
    boutonDroit.addEventListener("click", () => avancerInsertion("droite"));
}

if (boutonMenu) {
    boutonMenu.addEventListener("click", abandonnerClassement);
}

if (boutonArreter) {
    boutonArreter.addEventListener("click", abandonnerClassement);
}

initialiser();
