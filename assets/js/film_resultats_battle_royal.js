/*fichier JS de film_resultats_battle_royal.html*/
const CLE_TOP3_BATTLE_ROYAL = "film_top3_battle_royal";
const CLE_CLASSEMENT_FILMS = "film_classement_complet";

const affiches = {
    premiere: document.getElementById("affiche_film_2"),
    deuxieme: document.getElementById("affiche_film_1"),
    troisieme: document.getElementById("affiche_film_3")
};

const noms = {
    premiere: document.getElementById("nom_film_1"),
    deuxieme: document.getElementById("nom_film_2"),
    troisieme: document.getElementById("nom_film_3")
};

const listeClassement = document.getElementById("classement_liste");
const elementSauvegarde = document.getElementById("sauvegarde_info");

const normaliserNomFilm = (nomFichier) => {
    const dernierPoint = nomFichier.lastIndexOf(".");
    const base = dernierPoint > 0 ? nomFichier.slice(0, dernierPoint) : nomFichier;
    return base.replace(/_/g, " ");
};

const remplirCarte = (elementImage, elementNom, nomFichier, position) => {
    if (!elementImage || !elementNom) {
        return;
    }

    if (!nomFichier) {
        elementImage.removeAttribute("src");
        elementImage.alt = "Aucune affiche";
        elementNom.textContent = "-";
        return;
    }

    elementImage.src = `../film/affiche/${encodeURIComponent(nomFichier)}`;
    elementImage.alt = `Film classé ${position}`;
    elementNom.textContent = normaliserNomFilm(nomFichier);
};

const remplirClassementComplet = (classement) => {
    if (!listeClassement) {
        return;
    }

    listeClassement.innerHTML = "";

    classement.forEach((film) => {
        const item = document.createElement("li");
        item.textContent = normaliserNomFilm(film);
        listeClassement.appendChild(item);
    });
};

const sauvegarderClassement = async (classement) => {
    if (!elementSauvegarde) {
        return;
    }

    if (!window.electronAPI?.saveFilmClassement) {
        elementSauvegarde.textContent = "Sauvegarde indisponible.";
        return;
    }

    try {
        const resultat = await window.electronAPI.saveFilmClassement(classement);
        if (resultat?.filePath) {
            elementSauvegarde.textContent = `Classement enregistré dans ${resultat.filePath}`;
            return;
        }
        elementSauvegarde.textContent = "Classement enregistré.";
    } catch (_error) {
        elementSauvegarde.textContent = "Impossible d'enregistrer le classement.";
    }
};

const chargerClassement = () => {
    const classementBrut = sessionStorage.getItem(CLE_CLASSEMENT_FILMS);
    const top3Brut = sessionStorage.getItem(CLE_TOP3_BATTLE_ROYAL);

    let classement = [];
    let top3 = [];

    try {
        classement = JSON.parse(classementBrut ?? "[]");
    } catch (_error) {
        classement = [];
    }

    try {
        top3 = JSON.parse(top3Brut ?? "[]");
    } catch (_error) {
        top3 = [];
    }

    if (!Array.isArray(classement)) {
        classement = [];
    }

    if (classement.length === 0 && Array.isArray(top3)) {
        classement = top3;
    }

    return classement;
};

const initialiser = async () => {
    const classement = chargerClassement();

    remplirCarte(affiches.premiere, noms.premiere, classement[0], "1");
    remplirCarte(affiches.deuxieme, noms.deuxieme, classement[1], "2");
    remplirCarte(affiches.troisieme, noms.troisieme, classement[2], "3");

    remplirClassementComplet(classement);
    await sauvegarderClassement(classement);
};

void initialiser();
