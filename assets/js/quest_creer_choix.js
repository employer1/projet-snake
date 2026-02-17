/*fichier JS de quest_creer_choix.html*/
const stockageSelectionQuest = "quest_selection";
const stockageEditionQuest = "quest_creation_selection";
const dossierQuestionnaires = "questionnaire/";

const pagesCreationParType = {
    langue: "../pages/quest_creer_langue.html",
    qcm: "../pages/quest_creer_qcm.html",
    txt: "../pages/quest_creer_txt.html",
    "txt 2": "../pages/quest_creer_txt.html",
    texte: "../pages/quest_creer_txt.html",
};

const normaliserChemin = (chemin = "") => chemin.replace(/\\/g, "/").replace(/^\/+/, "");

const estQuestionnaire = (chemin) => {
    const cheminNormalise = normaliserChemin(chemin);
    return cheminNormalise.toLowerCase().endsWith(".json")
        && (!cheminNormalise.includes("/") || cheminNormalise.startsWith(dossierQuestionnaires));
};

const formatNomQuestionnaire = (nomFichier) => {
    const cheminNormalise = normaliserChemin(nomFichier);
    const nom = cheminNormalise.split("/").pop() || cheminNormalise;
    return nom.replace(/_/g, " ").replace(/\.json$/i, "");
};

const initialiserSelect = (select, questionnaires) => {
    select.innerHTML = "";

    if (!questionnaires.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Aucun questionnaire trouvé";
        option.disabled = true;
        option.selected = true;
        select.appendChild(option);
        return;
    }

    const optionPlaceholder = document.createElement("option");
    optionPlaceholder.value = "";
    optionPlaceholder.textContent = "Sélectionnez un questionnaire";
    optionPlaceholder.selected = true;
    select.appendChild(optionPlaceholder);

    questionnaires.forEach((nomFichier) => {
        const option = document.createElement("option");
        option.value = nomFichier;
        option.textContent = formatNomQuestionnaire(nomFichier);
        select.appendChild(option);
    });
};

const chargerQuestionnaires = async (select) => {
    if (!window.electronAPI?.listQuestnaires) {
        initialiserSelect(select, []);
        return;
    }

    try {
        const questionnaires = (await window.electronAPI.listQuestnaires()).filter(estQuestionnaire);
        initialiserSelect(select, questionnaires);
    } catch (error) {
        console.error("Impossible de charger les questionnaires", error);
        initialiserSelect(select, []);
    }
};

const chargerQuestionnaire = async (nomFichier) => {
    if (!window.electronAPI?.loadQuestnaire) {
        throw new Error("Chargement indisponible dans cet environnement");
    }
    return window.electronAPI.loadQuestnaire(nomFichier);
};

const mettreAJourEtatActions = (boutonDemarrer, boutonSupprimer, valeurSelectionnee) => {
    const aUneSelection = Boolean(valeurSelectionnee);
    boutonDemarrer.disabled = !aUneSelection;
    boutonSupprimer.disabled = !aUneSelection;
};

const demanderConfirmationSuppression = (nomQuestionnaire) => window.confirm(
    `Voulez-vous vraiment supprimer le questionnaire "${nomQuestionnaire}" ? Cette action est irréversible.`
);

const extrairePageCreation = (typeQuestionnaire) => {
    if (!typeQuestionnaire) return null;
    const typeNormalise = String(typeQuestionnaire).trim().toLowerCase();
    return pagesCreationParType[typeNormalise] || null;
};

document.addEventListener("DOMContentLoaded", async () => {
    const select = document.querySelector("select.choix");
    const boutonDemarrer = document.getElementById("demarrer");
    const boutonSupprimer = document.getElementById("supprimer");

    if (!select || !boutonDemarrer || !boutonSupprimer) return;

    await chargerQuestionnaires(select);

    const selectionSauvee = localStorage.getItem(stockageSelectionQuest) || "";
    if (selectionSauvee) {
        select.value = selectionSauvee;
    }

    mettreAJourEtatActions(boutonDemarrer, boutonSupprimer, select.value);

    select.addEventListener("change", () => {
        const valeur = select.value;
        if (valeur) {
            localStorage.setItem(stockageSelectionQuest, valeur);
        } else {
            localStorage.removeItem(stockageSelectionQuest);
            localStorage.removeItem(stockageEditionQuest);
        }
        mettreAJourEtatActions(boutonDemarrer, boutonSupprimer, valeur);
    });

    boutonDemarrer.addEventListener("click", async () => {
        if (!select.value) {
            alert("Sélectionnez un questionnaire pour continuer.");
            return;
        }

        try {
            const questionnaire = await chargerQuestionnaire(select.value);
            const pageCible = extrairePageCreation(questionnaire?.type);

            if (!pageCible) {
                alert("Le type de ce questionnaire n'est pas reconnu.");
                return;
            }

            localStorage.setItem(stockageSelectionQuest, select.value);
            localStorage.setItem(stockageEditionQuest, JSON.stringify({
                fichier: select.value,
                type: questionnaire.type,
                titre: questionnaire.titre || formatNomQuestionnaire(select.value),
            }));
            window.location.href = pageCible;
        } catch (error) {
            console.error("Impossible de charger le questionnaire sélectionné", error);
            alert("Impossible d'ouvrir le questionnaire sélectionné.");
        }
    });

    boutonSupprimer.addEventListener("click", async () => {
        const fichierSelectionne = select.value;
        if (!fichierSelectionne) {
            alert("Sélectionnez un questionnaire à supprimer.");
            return;
        }

        const nomAffiche = formatNomQuestionnaire(fichierSelectionne);
        if (!demanderConfirmationSuppression(nomAffiche)) {
            return;
        }

        if (!window.electronAPI?.deleteQuestnaire) {
            alert("La suppression n'est pas disponible dans cet environnement.");
            return;
        }

        try {
            await window.electronAPI.deleteQuestnaire(fichierSelectionne);
            localStorage.removeItem(stockageSelectionQuest);
            localStorage.removeItem(stockageEditionQuest);
            await chargerQuestionnaires(select);
            mettreAJourEtatActions(boutonDemarrer, boutonSupprimer, select.value);
            alert(`Le questionnaire "${nomAffiche}" a été supprimé.`);
        } catch (error) {
            console.error("Impossible de supprimer le questionnaire", error);
            alert("La suppression du questionnaire a échoué.");
        }
    });
});
