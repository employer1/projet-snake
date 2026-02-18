/*fichier JS pour quest_creer_langue_existe.html*/

const PAGE_MENU = "../pages/quest_menu.html";
const STOCKAGE_EDITION_QUEST = "quest_creation_selection";

const etatCreation = {
    jsonPath: "",
    questionnaire: {
        type: "langue",
        titre: "",
        questionnaire: [
            {
                "langue 1": {},
                "langue 2": {},
            },
        ],
    },
};

const afficherErreur = (message) => {
    window.alert(message);
};

const contientGuillemetInterdit = (valeur = "") => valeur.includes('"');

const verifierAbsenceGuillemetDansInputs = (champs = []) => {
    const champInvalide = champs.find(({ valeur }) => contientGuillemetInterdit(valeur));
    if (champInvalide) {
        throw new Error(`Le champ ${champInvalide.nom} ne peut pas contenir le caractère \".`);
    }
};

const nettoyerGuillemetsInterdits = (valeur = "") => valeur.replace(/"/g, "");

const activerFiltreGuillemets = (idChamp, nomChamp) => {
    const champ = document.getElementById(idChamp);
    if (!champ) {
        return;
    }

    champ.addEventListener("input", () => {
        if (!contientGuillemetInterdit(champ.value)) {
            return;
        }

        champ.value = nettoyerGuillemetsInterdits(champ.value);
        afficherErreur(`Le champ ${nomChamp} ne peut pas contenir le caractère \".`);
    });
};

const configurerValidationGuillemets = () => {
    activerFiltreGuillemets("langue_1", "mot langue 1");
    activerFiltreGuillemets("langue_2", "mot langue 2");
};

const sauvegarderQuestionnaire = async () => {
    if (!window.electronAPI?.writeQuestJson) {
        throw new Error("Sauvegarde indisponible dans cet environnement");
    }
    await window.electronAPI.writeQuestJson(etatCreation.jsonPath, etatCreation.questionnaire);
};

const chargerQuestionnaireExistant = async () => {
    const edition = localStorage.getItem(STOCKAGE_EDITION_QUEST);
    if (!edition) {
        throw new Error("Aucun questionnaire sélectionné pour l'édition.");
    }

    let configurationEdition;
    try {
        configurationEdition = JSON.parse(edition);
    } catch {
        throw new Error("La configuration d'édition est invalide.");
    }

    if (!configurationEdition?.fichier) {
        throw new Error("Le fichier du questionnaire à modifier est introuvable.");
    }

    etatCreation.jsonPath = configurationEdition.fichier;

    if (!window.electronAPI?.loadQuestnaire) {
        throw new Error("Chargement indisponible dans cet environnement");
    }

    const questionnaireExistant = await window.electronAPI.loadQuestnaire(etatCreation.jsonPath);
    if ((questionnaireExistant?.type || "").toLowerCase() !== "langue") {
        throw new Error("Le questionnaire sélectionné n'est pas de type langue.");
    }

    const dictionnaire = questionnaireExistant?.questionnaire?.[0] || {};
    etatCreation.questionnaire = {
        ...questionnaireExistant,
        questionnaire: [
            {
                "langue 1": dictionnaire["langue 1"] || {},
                "langue 2": dictionnaire["langue 2"] || {},
            },
        ],
    };
};

const construireTraduction = () => {
    const motLangue1 = document.getElementById("langue_1").value.trim();
    const motLangue2 = document.getElementById("langue_2").value.trim();

    if (!motLangue1 || !motLangue2) {
        throw new Error("Les champs mot langue 1 et mot langue 2 sont obligatoires.");
    }

    verifierAbsenceGuillemetDansInputs([
        { nom: "mot langue 1", valeur: motLangue1 },
        { nom: "mot langue 2", valeur: motLangue2 },
    ]);

    const dictionnaire = etatCreation.questionnaire.questionnaire[0] || { "langue 1": {}, "langue 2": {} };
    dictionnaire["langue 1"] ||= {};
    dictionnaire["langue 2"] ||= {};

    const traductionsLangue1 = dictionnaire["langue 1"][motLangue1] || [];
    const traductionsLangue2 = dictionnaire["langue 2"][motLangue2] || [];

    const ajoutDansLangue1 = !traductionsLangue1.includes(motLangue2);
    const ajoutDansLangue2 = !traductionsLangue2.includes(motLangue1);

    if (!ajoutDansLangue1 && !ajoutDansLangue2) {
        throw new Error("Cette traduction existe déjà dans le questionnaire.");
    }

    if (ajoutDansLangue1) {
        dictionnaire["langue 1"][motLangue1] = [...traductionsLangue1, motLangue2];
    } else {
        dictionnaire["langue 1"][motLangue1] = traductionsLangue1;
    }

    if (ajoutDansLangue2) {
        dictionnaire["langue 2"][motLangue2] = [...traductionsLangue2, motLangue1];
    } else {
        dictionnaire["langue 2"][motLangue2] = traductionsLangue2;
    }

    etatCreation.questionnaire.questionnaire[0] = dictionnaire;
};

const viderChamps = () => {
    document.getElementById("langue_1").value = "";
    document.getElementById("langue_2").value = "";
};

const abandonnerEtRetourMenu = async () => {
    window.location.href = PAGE_MENU;
};

const finirCreation = async () => {
    const dictionnaire = etatCreation.questionnaire.questionnaire[0];
    const nombreEntrees = Object.keys(dictionnaire?.["langue 1"] || {}).length;
    if (nombreEntrees === 0) {
        throw new Error("Ajoutez au moins une traduction avant de terminer le questionnaire.");
    }

    await sauvegarderQuestionnaire();
    window.location.href = PAGE_MENU;
};

document.addEventListener("DOMContentLoaded", async () => {
    if (!window.electronAPI) {
        afficherErreur("Cette page nécessite l'environnement Electron.");
        window.location.href = PAGE_MENU;
        return;
    }

    try {
        await chargerQuestionnaireExistant();
        configurerValidationGuillemets();
    } catch (error) {
        console.error(error);
        afficherErreur(error.message || "Initialisation impossible.");
        window.location.href = PAGE_MENU;
        return;
    }

    document.getElementById("ajouter").addEventListener("click", async () => {
        try {
            construireTraduction();
            await sauvegarderQuestionnaire();
            viderChamps();
        } catch (error) {
            console.error(error);
            afficherErreur(error.message || "Impossible d'ajouter la traduction.");
        }
    });

    document.getElementById("finir").addEventListener("click", async () => {
        try {
            await finirCreation();
        } catch (error) {
            console.error(error);
            afficherErreur(error.message || "Impossible de terminer le questionnaire.");
        }
    });

    const boutonAbandon = document.getElementById("abandonner");
    boutonAbandon.addEventListener("click", async () => {
        try {
            await abandonnerEtRetourMenu();
        } catch (error) {
            console.error(error);
            afficherErreur("Impossible d'abandonner proprement.");
            window.location.href = PAGE_MENU;
        }
    });

    const boutonMenu = document.querySelector('.bouton_menu .btn-text[data-page="../pages/quest_menu.html"]');
    if (boutonMenu) {
        boutonMenu.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
                await abandonnerEtRetourMenu();
            } catch (error) {
                console.error(error);
                window.location.href = PAGE_MENU;
            }
        });
    }
});
