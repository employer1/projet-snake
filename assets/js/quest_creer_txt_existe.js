/*fichier JS de quest_creer_txt*/

const DOSSIER_JSON = "questionnaire/autre";
const DOSSIER_IMG_BASE = "questionnaire/autre/img";
const PAGE_MENU = "../pages/quest_menu.html";

const etatCreation = {
    jsonPath: "",
    imgFolderName: "",
    sourceImageDir: "",
    questionnaire: {
        type: "txt",
        titre: "",
        reverse: 0,
        questionnaire: [],
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

const normaliserNomImage = (nom = "") => (nom.trim().replace(/\\/g, "/").split("/").pop() || "");

const versEntierBinaire = (valeur) => (String(valeur).trim() === "1" ? 1 : 0);

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

const demanderValeurObligatoire = async (message, valeurParDefaut = "") => {
    const valeur = await demanderValeurTexte(message, valeurParDefaut);
    if (valeur === null) {
        throw new Error("Action annulée.");
    }
    return valeur;
};

const desactiverChampImage = (desactiver) => {
    const inputImage = document.getElementById("image");
    inputImage.disabled = desactiver;
    if (desactiver) {
        inputImage.value = "";
        inputImage.placeholder = "Image désactivée (pas de dossier image)";
    } else {
        inputImage.placeholder = "nom_image.png ...";
    }
};

const sauvegarderQuestionnaire = async () => {
    if (!window.electronAPI?.writeQuestJson) {
        throw new Error("Sauvegarde indisponible dans cet environnement");
    }
    await window.electronAPI.writeQuestJson(etatCreation.jsonPath, etatCreation.questionnaire);
};

const demanderConfigurationInitiale = async () => {
    const dossierImages = await demanderValeurObligatoire(
        "Chemin du dossier d'images existant (optionnel, laisser vide si aucun) :",
        ""
    );

    if (dossierImages && !await window.electronAPI?.directoryExists?.(dossierImages.trim())) {
        throw new Error("Le dossier d'images indiqué n'existe pas.");
    }

    const nomBrut = await demanderValeurObligatoire("Nom du fichier JSON (ex: mon_questionnaire.json) :", "");
    const nomFichier = normaliserNomFichier(nomBrut || "");
    if (!nomFichier || nomFichier === ".json") {
        throw new Error("Nom de fichier invalide.");
    }

    const reverse = versEntierBinaire(await demanderValeurObligatoire("Valeur reverse (0 ou 1) :", "0"));

    etatCreation.jsonPath = `${DOSSIER_JSON}/${nomFichier}`;
    etatCreation.questionnaire.titre = titreDepuisNom(nomFichier);
    etatCreation.questionnaire.reverse = reverse;

    if (dossierImages && dossierImages.trim()) {
        etatCreation.sourceImageDir = dossierImages.trim();
        etatCreation.imgFolderName = `img_${nomFichier}`;
        await window.electronAPI.ensureQuestDirectory(`${DOSSIER_IMG_BASE}/${etatCreation.imgFolderName}`);
        desactiverChampImage(false);
    } else {
        desactiverChampImage(true);
    }

    await sauvegarderQuestionnaire();
};

const construireQuestion = async () => {
    const question = document.getElementById("question").value.trim();
    const reponse = document.getElementById("reponse").value.trim();
    const imageBrute = document.getElementById("image").value.trim();
    const definition = document.getElementById("def").value.trim();

    if (!question || !reponse) {
        throw new Error("Les champs Question et Réponse sont obligatoires.");
    }

    verifierAbsenceGuillemetDansInputs([
        { nom: "Question", valeur: question },
        { nom: "Réponse", valeur: reponse },
        { nom: "Image", valeur: imageBrute },
        { nom: "Solution", valeur: definition },
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

    if (imageBrute) {
        if (!etatCreation.sourceImageDir || !etatCreation.imgFolderName) {
            throw new Error("Aucun dossier image n'est configuré.");
        }

        const nomImage = normaliserNomImage(imageBrute);
        if (!nomImage.toLowerCase().endsWith(".png")) {
            throw new Error("L'image doit être un fichier .png.");
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
};

const abandonnerEtRetourMenu = async () => {
    if (etatCreation.jsonPath) {
        await window.electronAPI.removeQuestEntry(etatCreation.jsonPath);
    }
    if (etatCreation.imgFolderName) {
        await window.electronAPI.removeQuestEntry(`${DOSSIER_IMG_BASE}/${etatCreation.imgFolderName}`);
    }
    window.location.href = PAGE_MENU;
};

const finirCreation = async () => {
    if (etatCreation.questionnaire.questionnaire.length === 0) {
        throw new Error("Ajoutez au moins une question avant de terminer le questionnaire.");
    }

    const nouveauNom = await demanderValeurObligatoire(
        "Nom final du questionnaire JSON (laisser vide pour conserver le nom actuel):",
        etatCreation.jsonPath.split("/").pop() || ""
    );
    const nouveauReverse = versEntierBinaire(
        await demanderValeurObligatoire("Reverse final (0 ou 1)", String(etatCreation.questionnaire.reverse))
    );

    etatCreation.questionnaire.reverse = nouveauReverse;

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
