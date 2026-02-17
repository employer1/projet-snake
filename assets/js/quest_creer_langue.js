/*fichier JS de quest_creer_langue*/

const DOSSIER_JSON = "questionnaire/langue";
const PAGE_MENU = "../pages/quest_menu.html";

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

    etatCreation.jsonPath = `${DOSSIER_JSON}/${nomFichier}`;
    etatCreation.questionnaire.titre = titreDepuisNom(nomFichier);

    await sauvegarderQuestionnaire();
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

    const existeDejaLangue1 = Object.prototype.hasOwnProperty.call(dictionnaire["langue 1"], motLangue1);
    const existeDejaLangue2 = Object.prototype.hasOwnProperty.call(dictionnaire["langue 2"], motLangue2);
    if (existeDejaLangue1 || existeDejaLangue2) {
        throw new Error("Cette traduction existe déjà dans le questionnaire.");
    }

    dictionnaire["langue 1"][motLangue1] = [motLangue2];
    dictionnaire["langue 2"][motLangue2] = [motLangue1];
    etatCreation.questionnaire.questionnaire[0] = dictionnaire;
};

const viderChamps = () => {
    document.getElementById("langue_1").value = "";
    document.getElementById("langue_2").value = "";
};

const abandonnerEtRetourMenu = async () => {
    if (etatCreation.jsonPath) {
        await window.electronAPI.removeQuestEntry(etatCreation.jsonPath);
    }
    window.location.href = PAGE_MENU;
};

const finirCreation = async () => {
    const dictionnaire = etatCreation.questionnaire.questionnaire[0];
    const nombreEntrees = Object.keys(dictionnaire?.["langue 1"] || {}).length;
    if (nombreEntrees === 0) {
        throw new Error("Ajoutez au moins une traduction avant de terminer le questionnaire.");
    }

    const nouveauNom = await demanderValeurObligatoire(
        "Nom final du questionnaire JSON (laisser vide pour conserver le nom actuel):",
        etatCreation.jsonPath.split("/").pop() || ""
    );

    const nomNettoye = normaliserNomFichier(nouveauNom || etatCreation.jsonPath.split("/").pop() || "");
    if (nomNettoye && nomNettoye !== etatCreation.jsonPath.split("/").pop()) {
        const nouveauPath = `${DOSSIER_JSON}/${nomNettoye}`;
        etatCreation.questionnaire.titre = titreDepuisNom(nomNettoye);
        await window.electronAPI.writeQuestJson(nouveauPath, etatCreation.questionnaire);
        await window.electronAPI.removeQuestEntry(etatCreation.jsonPath);
        etatCreation.jsonPath = nouveauPath;
    } else {
        await sauvegarderQuestionnaire();
    }

    window.location.href = PAGE_MENU;
};

document.addEventListener("DOMContentLoaded", async () => {
    if (!window.electronAPI) {
        afficherErreur("Cette page nécessite l'environnement Electron.");
        window.location.href = PAGE_MENU;
        return;
    }

    try {
        await demanderConfigurationInitiale();
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
