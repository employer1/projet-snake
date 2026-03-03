/*fichier JS de film_resultats_classement*/
const CLE_CLASSEMENT_FILMS = "film_classement_complet";

const listeClassement = document.getElementById("liste_classement");
const elementSauvegarde = document.getElementById("sauvegarde_info");
const boutonSauvegarder = document.getElementById("sauvegarder");
const fenetreSauvegarde = document.getElementById("fenetre_sauvegarde");
const champNomSauvegarde = document.getElementById("nom_sauvegarde");
const elementNomSauvegardeInfo = document.getElementById("nom_sauvegarde_info");
const boutonAnnulerSauvegarde = document.getElementById("annuler_sauvegarde");
const boutonConfirmerSauvegarde = document.getElementById("confirmer_sauvegarde");

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

const ouvrirFenetreNomSauvegarde = () => {
    if (!fenetreSauvegarde || !champNomSauvegarde) {
        return;
    }

    fenetreSauvegarde.hidden = false;
    champNomSauvegarde.value = "";
    if (elementNomSauvegardeInfo) {
        elementNomSauvegardeInfo.textContent = "";
    }
    champNomSauvegarde.focus();
};

const fermerFenetreNomSauvegarde = () => {
    if (!fenetreSauvegarde) {
        return;
    }

    fenetreSauvegarde.hidden = true;
};

const demanderNomClassement = () => new Promise((resolve) => {
    if (!fenetreSauvegarde || !champNomSauvegarde || !boutonAnnulerSauvegarde || !boutonConfirmerSauvegarde) {
        resolve("");
        return;
    }

    const nettoyerEcouteurs = () => {
        boutonAnnulerSauvegarde.removeEventListener("click", gererAnnulation);
        boutonConfirmerSauvegarde.removeEventListener("click", gererConfirmation);
        champNomSauvegarde.removeEventListener("keydown", gererClavier);
        fenetreSauvegarde.removeEventListener("click", gererClicFond);
    };

    const terminer = (valeur) => {
        nettoyerEcouteurs();
        fermerFenetreNomSauvegarde();
        resolve(valeur);
    };

    const gererAnnulation = () => {
        terminer(null);
    };

    const gererConfirmation = () => {
        const nomSaisi = champNomSauvegarde.value.trim();

        if (!nomSaisi) {
            if (elementNomSauvegardeInfo) {
                elementNomSauvegardeInfo.textContent = "Veuillez saisir un nom de sauvegarde.";
            }
            champNomSauvegarde.focus();
            return;
        }

        terminer(nomSaisi);
    };

    const gererClavier = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            gererAnnulation();
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            gererConfirmation();
        }
    };

    const gererClicFond = (event) => {
        if (event.target === fenetreSauvegarde) {
            gererAnnulation();
        }
    };

    boutonAnnulerSauvegarde.addEventListener("click", gererAnnulation);
    boutonConfirmerSauvegarde.addEventListener("click", gererConfirmation);
    champNomSauvegarde.addEventListener("keydown", gererClavier);
    fenetreSauvegarde.addEventListener("click", gererClicFond);

    ouvrirFenetreNomSauvegarde();
});

const sauvegarderClassement = async (classement) => {
    if (!elementSauvegarde) {
        return;
    }

    if (!window.electronAPI?.saveFilmClassement) {
        elementSauvegarde.textContent = "Sauvegarde indisponible.";
        return;
    }

    const nomClassement = await demanderNomClassement();

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
