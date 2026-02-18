/*fichier JS de daily-note_lecture.html*/
const stockageDailyNoteSelection = "daily_note_selection";
const stockageDailyNoteContenu = "daily_note_contenu";

const formatterDateAffichage = (date) => {
    const formattee = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);

    return formattee.replace(/\b\p{L}/u, (lettre) => lettre.toUpperCase());
};

const extraireDateDepuisNomFichier = (nomFichier) => {
    if (!nomFichier) {
        return null;
    }

    const correspondance = String(nomFichier).match(/(\d{4})-(\d{2})-(\d{2})\.json$/);
    if (!correspondance) {
        return null;
    }

    const [, annee, mois, jour] = correspondance;
    return new Date(Number(annee), Number(mois) - 1, Number(jour));
};

const lireContenuLocal = () => {
    const brut = localStorage.getItem(stockageDailyNoteContenu);
    if (!brut) {
        return null;
    }

    try {
        return JSON.parse(brut);
    } catch (_error) {
        return null;
    }
};

const afficherListeTags = (tags) => {
    const conteneurTags = document.getElementById("champ_titre");
    if (!conteneurTags) {
        return;
    }

    conteneurTags.innerHTML = "";

    if (!Array.isArray(tags) || tags.length === 0) {
        conteneurTags.textContent = "Aucun tag disponible";
        return;
    }

    const liste = document.createElement("ul");

    tags.forEach((tag) => {
        const element = document.createElement("li");
        element.textContent = String(tag);
        liste.appendChild(element);
    });

    conteneurTags.appendChild(liste);
};

const chargerTagsDisponibles = async () => {
    try {
        const reponse = await fetch("../daily_note/tags.json");
        if (!reponse.ok) {
            afficherListeTags([]);
            return;
        }

        const tags = await reponse.json();
        afficherListeTags(tags);
    } catch (_error) {
        afficherListeTags([]);
    }
};

const initialiserPageLecture = () => {
    const nomFichier = localStorage.getItem(stockageDailyNoteSelection) || "";
    const dateFichier = extraireDateDepuisNomFichier(nomFichier);

    const titrePage = document.getElementById("daily-note-lecture-title");
    if (titrePage && dateFichier) {
        titrePage.textContent = `Note du ${formatterDateAffichage(dateFichier)}`;
    }

    const contenu = lireContenuLocal();
    const premiereHistoire = Array.isArray(contenu?.histoire) ? contenu.histoire[0] : null;

    const champTitre = document.getElementById("daily-note-title-input");
    const champTexte = document.getElementById("daily-note-text-input");

    if (champTitre && typeof premiereHistoire?.titre === "string") {
        champTitre.value = premiereHistoire.titre;
    }

    if (champTexte && typeof premiereHistoire?.texte === "string") {
        champTexte.value = premiereHistoire.texte;
    }

    chargerTagsDisponibles();
};

document.addEventListener("DOMContentLoaded", initialiserPageLecture);
