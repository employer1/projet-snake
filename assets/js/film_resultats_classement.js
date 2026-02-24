/*fichier JS de film_resultats_classement*/
const CLE_CLASSEMENT_FILMS = "film_classement_complet";

const listeClassement = document.getElementById("liste_classement");
const elementSauvegarde = document.getElementById("sauvegarde_info");
const boutonSauvegarder = document.getElementById("sauvegarder");

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

const demanderNomClassement = () => {
    try {
        if (typeof window.prompt !== "function") {
            return "";
        }

        return window.prompt("Nom du classement (nom du fichier) :");
    } catch (_error) {
        return "";
    }
};

const sauvegarderClassement = async (classement) => {
    if (!elementSauvegarde) {
        return;
    }

    if (!window.electronAPI?.saveFilmClassement) {
        elementSauvegarde.textContent = "Sauvegarde indisponible.";
        return;
    }

    const nomClassement = demanderNomClassement();

    if (nomClassement === null) {
        elementSauvegarde.textContent = "Sauvegarde annulée.";
        return;
    }

    try {
        const resultat = await window.electronAPI.saveFilmClassement(classement, nomClassement);
        if (resultat?.filePath) {
            elementSauvegarde.textContent = `Classement enregistré dans ${resultat.filePath}`;
            window.location.href = "../pages/film_menu.html";
            return;
        }
        elementSauvegarde.textContent = "Classement enregistré.";
        window.location.href = "../pages/film_menu.html";
    } catch (_error) {
        elementSauvegarde.textContent = "Impossible d'enregistrer le classement.";
    }
};

const chargerClassement = () => {
    const classementBrut = sessionStorage.getItem(CLE_CLASSEMENT_FILMS);
    let classement = [];

    try {
        classement = JSON.parse(classementBrut ?? "[]");
    } catch (_error) {
        classement = [];
    }

    if (!Array.isArray(classement)) {
        return [];
    }

    return classement;
};

const initialiser = () => {
    const classement = chargerClassement();
    afficherClassement(classement);

    if (boutonSauvegarder) {
        boutonSauvegarder.addEventListener("click", async () => {
            await sauvegarderClassement(classement);
        });
    }
};

void initialiser();
