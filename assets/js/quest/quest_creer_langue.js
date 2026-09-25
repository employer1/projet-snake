/*fichier JS de quest_creer_langue*/

const DOSSIER_JSON = "questionnaire/creer/langue";
const PAGE_MENU = "../quest/quest_menu.html";

const STOCKAGE_EDITION_QUEST = "quest_creation_selection";
const modeEdition = new URLSearchParams(window.location.search).get("mode") === "edition";

const etatCreation = {
    jsonPath: "",
    questionnaire: {
        type: "langue",
        titre: "",
        explication: "",
        questionnaire: [
            {
                "langue 1": {},
                "langue 2": {},
            },
        ],
    },
};

const normaliserNomFichier = (nom = "") => {
    let valeur = nom.trim().replace(/\\/g, "/").split("/").pop() || "";
    if (!valeur.toLowerCase().endsWith(".json")) {
        valeur = `${valeur}.json`;
    }
    return valeur.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const titreDepuisNom = (nomFichier) => nomFichier.replace(/\.json$/i, "").replace(/_/g, " ");

const afficherErreur = (message) => {
    window.alert(message);
};

const normaliserNomQuestionnaire = (valeur = "") => valeur.trim().toLowerCase();

const recupererFichiersQuestionnaire = async () => {
    if (!window.electronAPI?.listQuestnaires) {
        return [];
    }
    const fichiers = await window.electronAPI.listQuestnaires();
    return Array.isArray(fichiers)
        ? fichiers.filter((fichier) => typeof fichier === "string" && fichier.toLowerCase().endsWith(".json"))
        : [];
};

const verifierNomFichierDisponible = async (nomFichier, cheminActuel = "") => {
    const fichiers = await recupererFichiersQuestionnaire();
    const cible = `${DOSSIER_JSON}/${nomFichier}`.toLowerCase();
    const courant = cheminActuel.toLowerCase();
    const existeDeja = fichiers.some((fichier) => fichier.toLowerCase() === cible && fichier.toLowerCase() !== courant);
    if (existeDeja) {
        throw new Error("Un questionnaire utilise déjà ce nom de fichier.");
    }
};

const verifierTitreQuestionnaireDisponible = async (titre, cheminActuel = "") => {
    const titreNormalise = normaliserNomQuestionnaire(titre);
    if (!titreNormalise) {
        return;
    }

    const fichiers = await recupererFichiersQuestionnaire();
    const courant = cheminActuel.toLowerCase();

    for (const fichier of fichiers) {
        if (fichier.toLowerCase() === courant) {
            continue;
        }

        const questionnaire = await window.electronAPI.loadQuestnaire(fichier);
        if (normaliserNomQuestionnaire(questionnaire?.titre) === titreNormalise) {
            throw new Error("Un questionnaire portant ce nom existe déjà.");
        }
    }
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
    activerFiltreGuillemets("titre", "Titre");
    activerFiltreGuillemets("langue_1", "mot langue 1");
    activerFiltreGuillemets("langue_2", "mot langue 2");
};

const demanderValeurTexte = (message, valeurParDefaut = "") => new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const boite = document.createElement("div");
    boite.style.width = "min(520px, 92vw)";
    boite.style.background = "#fff";
    boite.style.color = "#000";
    boite.style.borderRadius = "12px";
    boite.style.padding = "20px";
    boite.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.25)";

    const titre = document.createElement("p");
    titre.textContent = message;
    titre.style.margin = "0 0 12px 0";
    titre.style.fontSize = "1rem";
    titre.style.color = "#000";

    const input = document.createElement("input");
    input.type = "text";
    input.value = valeurParDefaut;
    input.style.width = "100%";
    input.style.padding = "10px";
    input.style.marginBottom = "14px";
    input.style.boxSizing = "border-box";
    input.style.color = "#000";
    input.style.background = "#fff";
    input.style.caretColor = "#000";
    input.style.border = "1px solid #888";
    input.style.borderRadius = "8px";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const boutonAnnuler = document.createElement("button");
    boutonAnnuler.textContent = "Annuler";
    boutonAnnuler.style.padding = "8px 12px";

    const boutonValider = document.createElement("button");
    boutonValider.textContent = "Valider";
    boutonValider.style.padding = "8px 12px";

    const fermer = (valeur) => {
        overlay.remove();
        resolve(valeur);
    };

    const valider = () => {
        fermer(input.value.trim());
    };

    const appliquerFocusChamp = () => {
        input.focus();
        input.select();
    };

    boutonAnnuler.addEventListener("click", () => fermer(null));
    boutonValider.addEventListener("click", valider);

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            valider();
        }
        if (event.key === "Escape") {
            event.preventDefault();
            fermer(null);
        }
    });

    overlay.addEventListener("mousedown", (event) => {
        if (event.target === overlay) {
            event.preventDefault();
            appliquerFocusChamp();
        }
    });

    overlay.addEventListener("click", (event) => {
        if (event.target !== input && event.target !== boutonAnnuler && event.target !== boutonValider) {
            appliquerFocusChamp();
        }
    });

    actions.appendChild(boutonAnnuler);
    actions.appendChild(boutonValider);
    boite.appendChild(titre);
    boite.appendChild(input);
    boite.appendChild(actions);
    overlay.appendChild(boite);
    document.body.appendChild(overlay);
    requestAnimationFrame(appliquerFocusChamp);
    setTimeout(appliquerFocusChamp, 50);
});

const demanderValeurObligatoire = async (message, valeurParDefaut = "") => {
    const valeur = await demanderValeurTexte(message, valeurParDefaut);
    if (valeur === null) {
        throw new Error("Action annulée.");
    }
    return valeur;
};

const lireTitreQuestionnaire = () => {
    const titre = etatCreation.questionnaire.titre?.trim() || "";

    if (!titre) {
        throw new Error("Le titre du questionnaire est obligatoire.");
    }

    verifierAbsenceGuillemetDansInputs([{ nom: "Titre", valeur: titre }]);
    etatCreation.questionnaire.titre = titre;
};

const lireExplicationQuestionnaire = () => {
    etatCreation.questionnaire.explication = etatCreation.questionnaire.explication?.trim() || "";
};

const sauvegarderQuestionnaire = async () => {
    if (!window.electronAPI?.writeQuestJson) {
        throw new Error("Sauvegarde indisponible dans cet environnement");
    }
    await window.electronAPI.writeQuestJson(etatCreation.jsonPath, etatCreation.questionnaire);
};

const demanderConfigurationInitiale = async () => {
    const nomBrut = await demanderValeurObligatoire("Nom du fichier JSON (ex: mon_questionnaire_langue.json) :", "");
    const nomFichier = normaliserNomFichier(nomBrut || "");
    if (!nomFichier || nomFichier === ".json") {
        throw new Error("Nom de fichier invalide.");
    }
    await verifierNomFichierDisponible(nomFichier);

    etatCreation.jsonPath = `${DOSSIER_JSON}/${nomFichier}`;

    const titreQuestionnaire = await demanderValeurObligatoire(
        "Titre du questionnaire :",
        titreDepuisNom(nomFichier)
    );
    etatCreation.questionnaire.titre = titreQuestionnaire.trim();
    lireTitreQuestionnaire();
    await verifierTitreQuestionnaireDisponible(etatCreation.questionnaire.titre, etatCreation.jsonPath);

    const explicationQuestionnaire = await demanderValeurObligatoire(
        "Explication du questionnaire :",
        ""
    );
    etatCreation.questionnaire.explication = explicationQuestionnaire.trim();
    lireExplicationQuestionnaire();


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
    if (!modeEdition) {
        lireTitreQuestionnaire();
        lireExplicationQuestionnaire();
    }

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
        if (modeEdition) {
            await chargerQuestionnaireExistant();
            document.querySelector("h1").textContent = "Compléter le questionnaire";
            document.title = "Quest compléter langue";
        } else {
            await demanderConfigurationInitiale();
        }
        configurerValidationGuillemets();
    } catch (error) {
        console.error(error);
        afficherErreur(error.message || "Initialisation impossible.");
        window.location.href = PAGE_MENU;
        return;
    }

    window.initialiserEditeurQuest({
        etat: etatCreation,
        langue: true,
        construire: null,
        vider: viderChamps,
        finir: finirCreation,
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

    const boutonMenu = document.querySelector('.bouton_menu .btn-text[data-page="../quest/quest_menu.html"]');
    if (boutonMenu) {
        boutonMenu.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            try {
                await abandonnerEtRetourMenu();
            } catch (error) {
                console.error(error);
                window.location.href = PAGE_MENU;
            }
        }, { capture: true });
    }
});
