const CLE_MODE_FILM = "film_mode";
const CLE_SELECTION_FILMS = "film_selection";
const MODE_DEFAUT = "battle_royal";
const MINIMUM_FILMS = 3;

const configurationModes = {
    battle_royal: {
        titre: "Battle Royal",
        pageDemarrer: "../pages/film_battle_royal.html"
    },
    classement: {
        titre: "Classement",
        pageDemarrer: "../pages/film_classement.html"
    }
};

const modeSauvegarde = sessionStorage.getItem(CLE_MODE_FILM);
const modeActuel = configurationModes[modeSauvegarde] ? modeSauvegarde : MODE_DEFAUT;
const configuration = configurationModes[modeActuel];

const titre = document.querySelector("h1");
const boutonDemarrer = document.getElementById("film-start-button");
const elementPosition = document.querySelector(".position_1");
const imageAffiche = document.querySelector(".image");
const elementNom = document.getElementById("nom");
const boutonVu = document.getElementById("btn-vu");
const boutonPasVu = document.getElementById("btn-pas-vu");
const boutonRetour = document.getElementById("btn-retour-selection");

let affiches = [];
let indexAffiche = 0;
let filmsSelectionnes = [];

const normaliserNomFilm = (nomFichier) => {
    const dernierPoint = nomFichier.lastIndexOf(".");
    const base = dernierPoint > 0 ? nomFichier.slice(0, dernierPoint) : nomFichier;
    return base.replaceAll("_", " ");
};

const mettreAJourBoutonStart = () => {
    if (!boutonDemarrer) {
        return;
    }

    const peutDemarrer = filmsSelectionnes.length >= MINIMUM_FILMS;
    boutonDemarrer.disabled = !peutDemarrer;
    boutonDemarrer.setAttribute("aria-disabled", String(!peutDemarrer));

    if (peutDemarrer) {
        boutonDemarrer.title = "";
    } else {
        boutonDemarrer.title = `Sélectionne au moins ${MINIMUM_FILMS} films pour démarrer.`;
    }
};

const sauvegarderSelection = () => {
    sessionStorage.setItem(CLE_SELECTION_FILMS, JSON.stringify(filmsSelectionnes));
};

const afficherEtatVide = (message) => {
    if (imageAffiche) {
        imageAffiche.removeAttribute("src");
        imageAffiche.alt = "Aucune affiche";
    }

    if (elementNom) {
        elementNom.textContent = message;
    }

    if (elementPosition) {
        elementPosition.textContent = "0/0";
    }

    if (boutonVu) {
        boutonVu.disabled = true;
    }

    if (boutonPasVu) {
        boutonPasVu.disabled = true;
    }
};

const afficherAfficheCourante = () => {
    if (!affiches.length) {
        afficherEtatVide("Aucune affiche disponible");
        return;
    }

    const nomFichier = affiches[indexAffiche];
    const nomFilm = normaliserNomFilm(nomFichier);

    if (imageAffiche) {
        imageAffiche.src = `../film/affiche/${encodeURIComponent(nomFichier)}`;
        imageAffiche.alt = `Affiche du film ${nomFilm}`;
    }

    if (elementNom) {
        elementNom.textContent = nomFilm;
    }

    if (elementPosition) {
        elementPosition.textContent = `${indexAffiche + 1}/${affiches.length}`;
    }

    if (boutonVu) {
        boutonVu.disabled = false;
    }

    if (boutonPasVu) {
        boutonPasVu.disabled = false;
    }
};

const passerAfficheSuivante = () => {
    indexAffiche += 1;

    if (indexAffiche >= affiches.length) {
        afficherEtatVide("Sélection terminée");
        return;
    }

    afficherAfficheCourante();
};

const gererChoixAffiche = (aEteVu) => {
    if (!affiches.length || indexAffiche >= affiches.length) {
        return;
    }

    const nomFichier = affiches[indexAffiche];

    if (aEteVu) {
        filmsSelectionnes.push(nomFichier);
        sauvegarderSelection();
        mettreAJourBoutonStart();
    }

    passerAfficheSuivante();
};

const abandonnerSelection = () => {
    sessionStorage.removeItem(CLE_SELECTION_FILMS);
};

const initialiserNavigation = () => {
    sessionStorage.removeItem(CLE_SELECTION_FILMS);

    if (titre) {
        titre.textContent = configuration.titre;
    }

    if (boutonDemarrer) {
        boutonDemarrer.dataset.page = configuration.pageDemarrer;
        boutonDemarrer.addEventListener("click", (event) => {
            const peutDemarrer = filmsSelectionnes.length >= MINIMUM_FILMS;
            if (!peutDemarrer) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            sauvegarderSelection();
        });
    }

    const boutonMenu = document.querySelector(".bouton_menu .btn-text");
    if (boutonMenu) {
        boutonMenu.addEventListener("click", abandonnerSelection);
    }

    if (boutonRetour) {
        boutonRetour.addEventListener("click", () => {
            abandonnerSelection();
            window.location.href = "../pages/film_menu.html";
        });
    }
};

const initialiserActions = () => {
    if (boutonVu) {
        boutonVu.addEventListener("click", () => gererChoixAffiche(true));
    }

    if (boutonPasVu) {
        boutonPasVu.addEventListener("click", () => gererChoixAffiche(false));
    }
};

const chargerAffiches = async () => {
    if (!window.electronAPI?.listFilmAffiches) {
        afficherEtatVide("API indisponible");
        return;
    }

    try {
        affiches = await window.electronAPI.listFilmAffiches();
    } catch (_error) {
        affiches = [];
    }

    if (!Array.isArray(affiches)) {
        affiches = [];
    }

    indexAffiche = 0;
    afficherAfficheCourante();
};

initialiserNavigation();
initialiserActions();
mettreAJourBoutonStart();
void chargerAffiches();
