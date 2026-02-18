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
    const champTags = document.getElementById("daily-note-tags-input");
    const champTexte = document.getElementById("daily-note-text-input");

    if (champTitre && typeof premiereHistoire?.titre === "string") {
        champTitre.value = premiereHistoire.titre;
    }

    if (champTags && Array.isArray(premiereHistoire?.tags)) {
        champTags.value = premiereHistoire.tags.join(", ");
    }

    if (champTexte && typeof premiereHistoire?.texte === "string") {
        champTexte.value = premiereHistoire.texte;
    }
};

document.addEventListener("DOMContentLoaded", initialiserPageLecture);
