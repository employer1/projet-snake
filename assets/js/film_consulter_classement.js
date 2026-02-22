/*fichier JS de la page film_consulter_classement.html*/
const CLE_FICHIER_CLASSEMENT_FILM = "film_classement_fichier";

const listeClassement = document.getElementById("liste_classement");
const elementSauvegarde = document.getElementById("sauvegarde_info");

const normaliserNomFilm = (nomFichier) => {
    const dernierPoint = nomFichier.lastIndexOf(".");
    const base = dernierPoint > 0 ? nomFichier.slice(0, dernierPoint) : nomFichier;
    return base.replace(/_/g, " ");
};

const formatPosition = (index) => {
    if (index === 0) {
        return "1st";
    }
    if (index === 1) {
        return "2nd";
    }
    if (index === 2) {
        return "3rd";
    }
    return `${index + 1}th`;
};

const afficherClassement = (classement) => {
    if (!listeClassement) {
        return;
    }

    listeClassement.innerHTML = "";

    if (!classement.length) {
        const ligneVide = document.createElement("p");
        ligneVide.textContent = "Aucun classement disponible.";
        listeClassement.appendChild(ligneVide);
        return;
    }

    classement.forEach((film, index) => {
        const ligne = document.createElement("div");
        ligne.className = "ligne";

        const image = document.createElement("img");
        image.className = "image";
        image.src = `../film/affiche/${encodeURIComponent(film)}`;
        image.alt = `Affiche du film classé ${index + 1}`;

        const position = document.createElement("p");
        position.textContent = formatPosition(index);

        const nom = document.createElement("p");
        nom.textContent = normaliserNomFilm(film);

        ligne.appendChild(image);
        ligne.appendChild(position);
        ligne.appendChild(nom);
        listeClassement.appendChild(ligne);
    });
};

const chargerClassement = async () => {
    if (!elementSauvegarde) {
        return;
    }

    const fileName = sessionStorage.getItem(CLE_FICHIER_CLASSEMENT_FILM);

    if (!fileName) {
        elementSauvegarde.textContent = "Aucun fichier de classement sélectionné.";
        afficherClassement([]);
        return;
    }

    if (!window.electronAPI?.loadFilmClassement) {
        elementSauvegarde.textContent = "Lecture des classements indisponible.";
        afficherClassement([]);
        return;
    }

    try {
        const contenu = await window.electronAPI.loadFilmClassement(fileName);
        const classement = Array.isArray(contenu?.classement) ? contenu.classement : [];
        afficherClassement(classement);
        elementSauvegarde.textContent = `Classement chargé : ${fileName}`;
    } catch (_error) {
        afficherClassement([]);
        elementSauvegarde.textContent = "Impossible de charger le classement sélectionné.";
    }
};

void chargerClassement();
