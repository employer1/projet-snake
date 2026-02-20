/*fichier JS de quest_creer_qcm_existe.html*/

const DOSSIER_IMG_BASE = "questionnaire/creer/qcm/img";
const PAGE_MENU = "../pages/quest_menu.html";
const STOCKAGE_EDITION_QUEST = "quest_creation_selection";
const IDS_LEURRES = ["leurre_1", "leurre_2", "leurre_3", "leurre_4", "leurre_5"];

const etatCreation = {
    jsonPath: "",
    imgFolderName: "",
    sourceImageDir: "",
    questionnaire: {
        type: "qcm",
        titre: "",
        questionnaire: [],
    },
};

const normaliserNomImage = (nom = "") => (nom.trim().replace(/\\/g, "/").split("/").pop() || "");

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
    activerFiltreGuillemets("question", "Question");
    activerFiltreGuillemets("reponse", "Réponse");
    activerFiltreGuillemets("image", "Image");
    activerFiltreGuillemets("def", "Solution");
    IDS_LEURRES.forEach((idLeurre, index) => activerFiltreGuillemets(idLeurre, `Leurre ${index + 1}`));
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
    input.style.border = "1px solid #999";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const boutonAnnuler = document.createElement("button");
    boutonAnnuler.textContent = "Annuler";
    boutonAnnuler.type = "button";
    boutonAnnuler.style.color = "#000";
    boutonAnnuler.style.background = "#f3f3f3";

    const boutonValider = document.createElement("button");
    boutonValider.textContent = "Valider";
    boutonValider.type = "button";
    boutonValider.style.color = "#000";
    boutonValider.style.background = "#f3f3f3";

    const appliquerFocusChamp = () => {
        input.focus();
        input.select();
    };

    const fermer = (valeur) => {
        document.removeEventListener("keydown", onKeyDown);
        overlay.remove();
        resolve(valeur);
    };

    const onKeyDown = (event) => {
        if (event.key === "Escape") {
            fermer(null);
        } else if (event.key === "Enter") {
            fermer(input.value);
        }
    };

    boutonAnnuler.addEventListener("click", () => fermer(null));
    boutonValider.addEventListener("click", () => fermer(input.value));
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            fermer(null);
        }
    });
    document.addEventListener("keydown", onKeyDown);
    boite.addEventListener("click", (event) => {
        if (event.target !== boutonAnnuler && event.target !== boutonValider) {
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

const desactiverChampImage = (desactiver) => {
    const inputImage = document.getElementById("image");
    inputImage.disabled = desactiver;
    if (desactiver) {
        inputImage.value = "";
        inputImage.placeholder = "Image désactivée (pas de dossier image)";
    } else {
        inputImage.placeholder = "nom_image.png ou nom_image.jpg ...";
    }
};

const sauvegarderQuestionnaire = async () => {
    if (!window.electronAPI?.writeQuestJson) {
        throw new Error("Sauvegarde indisponible dans cet environnement");
    }
    await window.electronAPI.writeQuestJson(etatCreation.jsonPath, etatCreation.questionnaire);
};

const extraireNomDossierImagesDepuisQuestionnaire = (questionnaire) => {
    const questions = questionnaire?.questionnaire || [];
    for (const entree of questions) {
        const cheminImage = entree?.image;
        if (!cheminImage) {
            continue;
        }

        const correspondance = String(cheminImage)
            .replace(/^\/+/, "")
            .match(/^quest\/questionnaire\/creer\/qcm\/img\/([^/]+)\//i);

        if (correspondance?.[1]) {
            return correspondance[1];
        }
    }

    return "";
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
    if ((questionnaireExistant?.type || "").toLowerCase() !== "qcm") {
        throw new Error("Le questionnaire sélectionné n'est pas de type QCM.");
    }

    etatCreation.questionnaire = {
        ...questionnaireExistant,
        questionnaire: Array.isArray(questionnaireExistant?.questionnaire)
            ? questionnaireExistant.questionnaire
            : [],
    };

    const dossierImageExistant = extraireNomDossierImagesDepuisQuestionnaire(etatCreation.questionnaire);
    if (dossierImageExistant) {
        etatCreation.imgFolderName = dossierImageExistant;
        await window.electronAPI.ensureQuestDirectory(`${DOSSIER_IMG_BASE}/${etatCreation.imgFolderName}`);
    }
};

const initialiserGestionImages = async () => {
    const dossierImages = await demanderValeurTexte(
        "Chemin du dossier d'images source (optionnel, laisser vide si aucun) :",
        ""
    );

    if (dossierImages === null || !dossierImages.trim()) {
        if (!etatCreation.imgFolderName) {
            desactiverChampImage(true);
        }
        return;
    }

    const dossierSource = dossierImages.trim();
    const dossierExiste = await window.electronAPI?.directoryExists?.(dossierSource);
    if (!dossierExiste) {
        throw new Error("Le dossier d'images indiqué n'existe pas.");
    }

    etatCreation.sourceImageDir = dossierSource;

    if (!etatCreation.imgFolderName) {
        const nomFichier = (etatCreation.jsonPath.split("/").pop() || "questionnaire.json")
            .replace(/\.json$/i, "");
        etatCreation.imgFolderName = `img_${nomFichier}.json`;
    }

    await window.electronAPI.ensureQuestDirectory(`${DOSSIER_IMG_BASE}/${etatCreation.imgFolderName}`);
    desactiverChampImage(false);
};

const construireQuestion = async () => {
    const question = document.getElementById("question").value.trim();
    const reponse = document.getElementById("reponse").value.trim();
    const imageBrute = document.getElementById("image").value.trim();
    const definition = document.getElementById("def").value.trim();
    const leurres = IDS_LEURRES.map((idLeurre) => document.getElementById(idLeurre).value.trim());

    if (!question || !reponse || !leurres[0]) {
        throw new Error("Les champs Question, Réponse et Leurre 1 sont obligatoires.");
    }

    verifierAbsenceGuillemetDansInputs([
        { nom: "Question", valeur: question },
        { nom: "Réponse", valeur: reponse },
        { nom: "Image", valeur: imageBrute },
        { nom: "Solution", valeur: definition },
        ...leurres.map((leurre, index) => ({ nom: `Leurre ${index + 1}`, valeur: leurre })),
    ]);

    const questionExisteDeja = etatCreation.questionnaire.questionnaire.some(
        (entreeExistante) => entreeExistante.question?.trim().toLowerCase() === question.toLowerCase()
    );
    if (questionExisteDeja) {
        throw new Error("Cette question existe déjà dans le fichier JSON.");
    }

    const entree = { question, reponse };

    if (definition) {
        entree.def = definition;
    }

    const leurresRenseignes = leurres.filter(Boolean);
    if (leurresRenseignes.length) {
        entree.leurres = leurresRenseignes;
    }

    if (imageBrute) {
        if (!etatCreation.sourceImageDir || !etatCreation.imgFolderName) {
            throw new Error("Configurez d'abord un dossier d'images source.");
        }

        const nomImage = normaliserNomImage(imageBrute);
        if (!/\.(png|jpg)$/i.test(nomImage)) {
            throw new Error("L'image doit être un fichier .png ou .jpg.");
        }

        const sourcePath = `${etatCreation.sourceImageDir.replace(/[\\/]$/, "")}/${nomImage}`;
        const existe = await window.electronAPI.fileExists(sourcePath);
        if (!existe) {
            throw new Error(`Image introuvable: ${nomImage}`);
        }

        const destinationRelative = `${DOSSIER_IMG_BASE}/${etatCreation.imgFolderName}/${nomImage}`;
        await window.electronAPI.copyFileToQuest(sourcePath, destinationRelative);
        entree.image = `/quest/${destinationRelative}`;
    }

    return entree;
};

const viderChamps = () => {
    document.getElementById("question").value = "";
    document.getElementById("reponse").value = "";
    document.getElementById("def").value = "";
    document.getElementById("image").value = "";
    IDS_LEURRES.forEach((idLeurre) => {
        document.getElementById(idLeurre).value = "";
    });
};

const abandonnerEtRetourMenu = async () => {
    window.location.href = PAGE_MENU;
};

const finirCreation = async () => {
    if (etatCreation.questionnaire.questionnaire.length === 0) {
        throw new Error("Ajoutez au moins une question avant de terminer le questionnaire.");
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
        await initialiserGestionImages();
        configurerValidationGuillemets();
    } catch (error) {
        console.error(error);
        afficherErreur(error.message || "Initialisation impossible.");
        window.location.href = PAGE_MENU;
        return;
    }

    document.getElementById("ajouter").addEventListener("click", async () => {
        try {
            const entree = await construireQuestion();
            etatCreation.questionnaire.questionnaire.push(entree);
            await sauvegarderQuestionnaire();
            viderChamps();
        } catch (error) {
            console.error(error);
            afficherErreur(error.message || "Impossible d'ajouter la question.");
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
