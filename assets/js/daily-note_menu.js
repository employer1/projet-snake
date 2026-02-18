/*fichier JS de daily-note_menu*/
const stockageDailyNoteSelection = "daily_note_selection";
const stockageDailyNoteContenu = "daily_note_contenu";

const structureParDefaut = {
    histoire: [
        {
            titre: "",
            tags: [],
            texte: "",
        },
    ],
};

const formatterDateAffichage = (date) => {
    const formattee = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);

    return formattee.replace(/\b\p{L}/u, (lettre) => lettre.toUpperCase());
};

const obtenirNomFichierDuJour = (date = new Date()) => {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");
    return `${annee}-${mois}-${jour}.json`;
};

const sauvegarderContexteLocal = (fileName, contenu) => {
    localStorage.setItem(stockageDailyNoteSelection, fileName);
    localStorage.setItem(stockageDailyNoteContenu, JSON.stringify(contenu));
};

const ouvrirOuCreerNoteDuJour = async () => {
    const nomFichier = obtenirNomFichierDuJour();

    if (!window.electronAPI?.openOrCreateDailyNote) {
        sauvegarderContexteLocal(nomFichier, structureParDefaut);
        window.location.href = "../pages/daily-note_lecture.html";
        return;
    }

    try {
        const resultat = await window.electronAPI.openOrCreateDailyNote(nomFichier, structureParDefaut);
        const contenu = resultat?.content ?? structureParDefaut;
        sauvegarderContexteLocal(resultat?.fileName || nomFichier, contenu);
        window.location.href = "../pages/daily-note_lecture.html";
    } catch (error) {
        console.error("Impossible d'ouvrir ou créer la note du jour", error);
        alert("Impossible d'ouvrir la note du jour.");
    }
};

const initialiserPage = () => {
    const elementDate = document.getElementById("daily-note-date");
    if (elementDate) {
        elementDate.textContent = formatterDateAffichage(new Date());
    }

    const boutonCreation = document.getElementById("daily-note-create");
    if (boutonCreation) {
        boutonCreation.addEventListener("click", () => {
            void ouvrirOuCreerNoteDuJour();
        });
    }
};

document.addEventListener("DOMContentLoaded", initialiserPage);
