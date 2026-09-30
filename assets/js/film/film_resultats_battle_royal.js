/*fichier JS de film_resultats_battle_royal.html*/
const CLE_TOP3_BATTLE_ROYAL = "film_top3_battle_royal";

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

    elementImage.src = `../../module/film/affiche/${encodeURIComponent(nomFichier)}`;
    elementImage.alt = `Film classé ${position}`;
    elementNom.textContent = normaliserNomFilm(nomFichier);
};

const chargerClassement = () => {
    const top3Brut = sessionStorage.getItem(CLE_TOP3_BATTLE_ROYAL);

    let top3 = [];

    try {
        top3 = JSON.parse(top3Brut ?? "[]");
    } catch (_error) {
        top3 = [];
    }

    return Array.isArray(top3) && top3.every(film => typeof film === "string" && film.trim())
        ? top3.slice(0, 3)
        : [];
};

const initialiser = () => {
    const classement = chargerClassement();

    remplirCarte(affiches.premiere, noms.premiere, classement[0], "1");
    remplirCarte(affiches.deuxieme, noms.deuxieme, classement[1], "2");
    remplirCarte(affiches.troisieme, noms.troisieme, classement[2], "3");
};

initialiser();
