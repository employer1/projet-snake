/*fichier JS de daily-note_lecture.html*/
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

const etat = {
    fileName: "",
    content: structuredClone(structureParDefaut),
    indexActif: 0,
};

const obtenirNomFichierDuJour = (date = new Date()) => {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");
    return `${annee}-${mois}-${jour}.json`;
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

const normaliserContenu = (contenu) => {
    if (!contenu || typeof contenu !== "object") {
        return structuredClone(structureParDefaut);
    }

    const histoires = Array.isArray(contenu.histoire) ? contenu.histoire : [];
    const histoiresNettoyees = histoires.map((histoire) => ({
        titre: typeof histoire?.titre === "string" ? histoire.titre : "",
        tags: Array.isArray(histoire?.tags)
            ? histoire.tags.filter((tag) => typeof tag === "string")
            : [],
        texte: typeof histoire?.texte === "string" ? histoire.texte : "",
    }));

    if (histoiresNettoyees.length === 0) {
        histoiresNettoyees.push({ titre: "", tags: [], texte: "" });
    }

    return { histoire: histoiresNettoyees };
};

const parserTags = (valeurBrute) => valeurBrute
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const sauvegarderContexteLocal = () => {
    localStorage.setItem(stockageDailyNoteSelection, etat.fileName);
    localStorage.setItem(stockageDailyNoteContenu, JSON.stringify(etat.content));
};

const sauvegarderChampsDansEtat = () => {
    const champTitre = document.getElementById("titre");
    const champTags = document.getElementById("tags");
    const champTexte = document.getElementById("texte");
    const histoire = etat.content.histoire[etat.indexActif];

    if (!histoire) {
        return;
    }

    histoire.titre = champTitre?.value ?? "";
    histoire.tags = parserTags(champTags?.value ?? "");
    histoire.texte = champTexte?.value ?? "";
};

const afficherChamps = () => {
    const histoire = etat.content.histoire[etat.indexActif] || { titre: "", tags: [], texte: "" };

    const champTitre = document.getElementById("titre");
    const champTags = document.getElementById("tags");
    const champTexte = document.getElementById("texte");

    if (champTitre) {
        champTitre.value = histoire.titre;
    }
    if (champTags) {
        champTags.value = histoire.tags.join(", ");
    }
    if (champTexte) {
        champTexte.value = histoire.texte;
    }
};

const afficherTitrePage = () => {
    const titrePage = document.getElementById("daily-note-lecture-title");
    if (!titrePage) {
        return;
    }

    titrePage.textContent = etat.fileName || obtenirNomFichierDuJour();
};

const creerCarteHistoire = (histoire, index) => {
    const carte = document.createElement("button");
    carte.className = "exemple";
    carte.type = "button";

    if (index === etat.indexActif) {
        carte.style.border = "2px solid #ffffff";
    }

    const titre = document.createElement("h4");
    titre.textContent = histoire.titre || `Histoire ${index + 1}`;
    carte.appendChild(titre);

    carte.addEventListener("click", () => {
        sauvegarderChampsDansEtat();
        etat.indexActif = index;
        afficherChamps();
        afficherListeHistoires();
    });

    return carte;
};

const afficherListeHistoires = () => {
    const liste = document.getElementById("daily-note-story-list");
    if (!liste) {
        return;
    }

    liste.innerHTML = "";
    etat.content.histoire.forEach((histoire, index) => {
        liste.appendChild(creerCarteHistoire(histoire, index));
    });
};

const sauvegarderNote = async () => {
    sauvegarderChampsDansEtat();

    if (window.electronAPI?.saveDailyNote) {
        await window.electronAPI.saveDailyNote(etat.fileName, etat.content);
    }

    sauvegarderContexteLocal();
    afficherListeHistoires();
};

const ajouterNouvelleHistoire = () => {
    sauvegarderChampsDansEtat();
    etat.content.histoire.push({ titre: "", tags: [], texte: "" });
    etat.indexActif = etat.content.histoire.length - 1;
    afficherChamps();
    afficherListeHistoires();
    sauvegarderContexteLocal();
};

const chargerDepuisContexteOuDisque = async () => {
    const nomDepuisContexte = localStorage.getItem(stockageDailyNoteSelection) || "";
    const contenuContexte = lireContenuLocal();

    if (nomDepuisContexte && contenuContexte) {
        etat.fileName = nomDepuisContexte;
        etat.content = normaliserContenu(contenuContexte);
        return;
    }

    etat.fileName = nomDepuisContexte || obtenirNomFichierDuJour();
    if (window.electronAPI?.openOrCreateDailyNote) {
        const resultat = await window.electronAPI.openOrCreateDailyNote(etat.fileName, structureParDefaut);
        etat.fileName = resultat?.fileName || etat.fileName;
        etat.content = normaliserContenu(resultat?.content);
        return;
    }

    etat.content = structuredClone(structureParDefaut);
};

const initialiserPageLecture = async () => {
    try {
        await chargerDepuisContexteOuDisque();
        afficherTitrePage();
        afficherChamps();
        afficherListeHistoires();
        sauvegarderContexteLocal();

        const boutonSauvegarde = document.getElementById("daily-note-save-btn");
        if (boutonSauvegarde) {
            boutonSauvegarde.addEventListener("click", () => {
                void sauvegarderNote();
            });
        }

        const boutonNouvelleHistoire = document.getElementById("daily-note-new-story-btn");
        if (boutonNouvelleHistoire) {
            boutonNouvelleHistoire.addEventListener("click", ajouterNouvelleHistoire);
        }
    } catch (error) {
        console.error("Impossible de charger la note", error);
        alert("Impossible de charger la note.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    void initialiserPageLecture();
});
