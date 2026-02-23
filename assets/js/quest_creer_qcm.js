/*fichier JS de quest_creer_qcm*/

const DOSSIER_JSON = "questionnaire/creer/qcm";
const DOSSIER_IMG_BASE = "questionnaire/creer/qcm/img";
const PAGE_MENU = "../pages/quest_menu.html";
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

const normaliserNomFichier = (nom = "") => {
    let valeur = nom.trim().replace(/\\/g, "/").split("/").pop() || "";
    if (!valeur.toLowerCase().endsWith(".json")) {
        valeur = `${valeur}.json`;
    }
    return valeur.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const titreDepuisNom = (nomFichier) => nomFichier.replace(/\.json$/i, "").replace(/_/g, " ");
const nomDossierImageDepuisNomFichier = (nomFichier) => `img_${nomFichier.replace(/\.json$/i, "")}`;

const normaliserNomImage = (nom = "") => (nom.trim().replace(/\\/g, "/").split("/").pop() || "");

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


const verifierUniciteReponseEtLeurres = (reponse, leurres = []) => {
    const propositions = [
        { nom: "Réponse", valeur: reponse },
        ...leurres.map((leurre, index) => ({ nom: `Leurre ${index + 1}`, valeur: leurre })),
    ].filter(({ valeur }) => Boolean(valeur));

    const valeursDejaVues = new Map();
    for (const proposition of propositions) {
        const cle = proposition.valeur.toLowerCase();
        if (valeursDejaVues.has(cle)) {
            const premierChamp = valeursDejaVues.get(cle);
            throw new Error(`Les champs ${premierChamp} et ${proposition.nom} doivent être différents.`);
        }
        valeursDejaVues.set(cle, proposition.nom);
    }
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
        inputImage.placeholder = "nom_image.png ou nom_image.jpg ...";
    }
};

const lireTitreQuestionnaire = () => {
    const champTitre = document.getElementById("titre");
    const titre = champTitre?.value.trim() || "";

    if (!titre) {
        throw new Error("Le champ Titre est obligatoire.");
    }
    etatCreation.questionnaire.titre = titre;
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
    await verifierNomFichierDisponible(nomFichier);

    etatCreation.jsonPath = `${DOSSIER_JSON}/${nomFichier}`;

    const titreQuestionnaire = await demanderValeurObligatoire(
        "Titre du questionnaire :",
        titreDepuisNom(nomFichier)
    );
    const champTitre = document.getElementById("titre");
    if (champTitre) {
        champTitre.value = titreQuestionnaire.trim();
    }
    lireTitreQuestionnaire();
    await verifierTitreQuestionnaireDisponible(etatCreation.questionnaire.titre, etatCreation.jsonPath);

    if (dossierImages && dossierImages.trim()) {
        etatCreation.sourceImageDir = dossierImages.trim();
        etatCreation.imgFolderName = nomDossierImageDepuisNomFichier(nomFichier);
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
    const leurres = IDS_LEURRES.map((idLeurre) => document.getElementById(idLeurre).value.trim());

    if (!question || !reponse || !leurres[0]) {
        throw new Error("Les champs Question, Réponse et Leurre 1 sont obligatoires.");
    }

    verifierUniciteReponseEtLeurres(reponse, leurres);

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
            throw new Error("Aucun dossier image n'est configuré.");
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
    if (etatCreation.jsonPath) {
        await window.electronAPI.removeQuestEntry(etatCreation.jsonPath);
    }
    if (etatCreation.imgFolderName) {
        await window.electronAPI.removeQuestEntry(`${DOSSIER_IMG_BASE}/${etatCreation.imgFolderName}`);
    }
    window.location.href = PAGE_MENU;
};

const finirCreation = async () => {
    lireTitreQuestionnaire();
    await verifierTitreQuestionnaireDisponible(etatCreation.questionnaire.titre, etatCreation.jsonPath);

    if (etatCreation.questionnaire.questionnaire.length === 0) {
        throw new Error("Ajoutez au moins une question avant de terminer le questionnaire.");
    }

    const nouveauNom = await demanderValeurObligatoire(
        "Nom final du questionnaire JSON (laisser vide pour conserver le nom actuel):",
        etatCreation.jsonPath.split("/").pop() || ""
    );

    const nomNettoye = normaliserNomFichier(nouveauNom || etatCreation.jsonPath.split("/").pop() || "");
    if (nomNettoye && nomNettoye !== etatCreation.jsonPath.split("/").pop()) {
        await verifierNomFichierDisponible(nomNettoye, etatCreation.jsonPath);
        const nouveauPath = `${DOSSIER_JSON}/${nomNettoye}`;
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
    } catch (error) {
        console.error(error);
        afficherErreur(error.message || "Initialisation impossible.");
        window.location.href = PAGE_MENU;
        return;
    }

    document.getElementById("ajouter").addEventListener("click", async () => {
        try {
            lireTitreQuestionnaire();
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
