/*fichier JS de quest_creer_qcm*/

const DOSSIER_JSON = "questionnaire/creer/qcm";
const DOSSIER_IMAGE_QUEST = "img";
const PAGE_MENU = "../quest/quest_menu.html";
const IDS_LEURRES = ["leurre_1", "leurre_2", "leurre_3", "leurre_4", "leurre_5"];

const STOCKAGE_EDITION_QUEST = "quest_creation_selection";
const modeEdition = new URLSearchParams(window.location.search).get("mode") === "edition";

const etatCreation = {
    jsonPath: "",
    imgFolderName: "",
    sourceImageDir: "",
    questionnaire: {
        type: "qcm",
        titre: "",
        explication: "",
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
const dossierDepuisCheminJson = (cheminJson = "") => {
    const segments = String(cheminJson).replace(/\\/g, "/").split("/").filter(Boolean);
    segments.pop();
    return segments.join("/");
};
const construireCheminDossierImage = (cheminJson, nomDossierImage) => {
    if (modeEdition) {
        const dossierJson = dossierDepuisCheminJson(cheminJson);
        return dossierJson ? `${dossierJson}/${nomDossierImage}` : nomDossierImage;
    }
    return `${DOSSIER_IMAGE_QUEST}/${nomDossierImage}`;
};

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
    const titre = etatCreation.questionnaire.titre?.trim() || "";

    if (!titre) {
        throw new Error("Le titre du questionnaire est obligatoire.");
    }
    etatCreation.questionnaire.titre = titre;
};

const lireExplicationQuestionnaire = () => {
    etatCreation.questionnaire.explication = etatCreation.questionnaire.explication?.trim() || "";
};

const sauvegarderQuestionnaire = async () => {
    if (!window.electronAPI?.writeQuestJson) {
        throw new Error("Sauvegarde indisponible dans cet environnement");
    }
    const copies = [];
    try {
        for (const entree of etatCreation.questionnaire.questionnaire) {
            const image = imagesEnAttente.get(entree.image);
            if (image && !copies.includes(image.destinationRelative)) {
                copies.push(image.destinationRelative);
                await window.electronAPI.copyFileToQuest(image.sourcePath, image.destinationRelative);
            }
        }
        await window.electronAPI.writeQuestJson(etatCreation.jsonPath, etatCreation.questionnaire);
        imagesEnAttente.clear();
    } catch (error) {
        await Promise.allSettled(copies.map(chemin => window.electronAPI.removeQuestEntry(chemin)));
        throw error;
    }
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
    etatCreation.questionnaire.titre = titreQuestionnaire.trim();
    lireTitreQuestionnaire();
    await verifierTitreQuestionnaireDisponible(etatCreation.questionnaire.titre, etatCreation.jsonPath);

    const explicationQuestionnaire = await demanderValeurObligatoire(
        "Explication du questionnaire :",
        ""
    );
    etatCreation.questionnaire.explication = explicationQuestionnaire.trim();
    lireExplicationQuestionnaire();

    if (dossierImages && dossierImages.trim()) {
        etatCreation.sourceImageDir = dossierImages.trim();
        etatCreation.imgFolderName = nomDossierImageDepuisNomFichier(nomFichier);
        etatCreation.questionnaire.path = construireCheminDossierImage(
            etatCreation.jsonPath,
            etatCreation.imgFolderName,
        );
        desactiverChampImage(false);
    } else {
        desactiverChampImage(true);
    }


};

const extraireNomDossierImagesDepuisQuestionnaire = (questionnaire) => {
    const dossierQuestionnaire = String(questionnaire?.path || "").replace(/[\\/]+$/, "");
    if (dossierQuestionnaire) {
        const segments = dossierQuestionnaire.split(/[\\/]/).filter(Boolean);
        return segments[segments.length - 1] || "";
    }

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
        etatCreation.questionnaire.path = etatCreation.questionnaire.path || construireCheminDossierImage(
            etatCreation.jsonPath,
            etatCreation.imgFolderName,
        );
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
        etatCreation.imgFolderName = nomDossierImageDepuisNomFichier(nomFichier);
    }

    etatCreation.questionnaire.path = etatCreation.questionnaire.path || construireCheminDossierImage(
        etatCreation.jsonPath,
        etatCreation.imgFolderName,
    );
    desactiverChampImage(false);
};

const imagesEnAttente = new Map();

const construireQuestion = async (indexEdition = -1) => {
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
        (entreeExistante, index) => index !== indexEdition && entreeExistante.question?.trim().toLowerCase() === question.toLowerCase()
    );
    if (questionExisteDeja) {
        throw new Error("Cette question existe déjà dans le fichier JSON.");
    }

    const entree = { question, reponse, def: definition, image: "" };

    if (definition) {
        entree.def = definition;
    }

    const leurresRenseignes = leurres.filter(Boolean);
    if (leurresRenseignes.length) {
        entree.leurres = leurresRenseignes;
    }

    const imageExistante = etatCreation.questionnaire.questionnaire[indexEdition]?.image;
    if (imageBrute && imageBrute === imageExistante) {
        entree.image = imageBrute;
    } else if (imageBrute) {
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

        if (!etatCreation.questionnaire.path) {
            etatCreation.questionnaire.path = construireCheminDossierImage(
                etatCreation.jsonPath,
                etatCreation.imgFolderName,
            );
        }

        const nomUnique = `${crypto.randomUUID()}_${nomImage}`;
        const destinationRelative = `${etatCreation.questionnaire.path}/${nomUnique}`;
        imagesEnAttente.set(nomUnique, { sourcePath, destinationRelative });
        entree.image = nomUnique;
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
    if (!modeEdition) {
        lireTitreQuestionnaire();
        lireExplicationQuestionnaire();
    }
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
        if (modeEdition) {
            await chargerQuestionnaireExistant();
            await initialiserGestionImages();
            document.querySelector("h1").textContent = "Compléter le questionnaire";
            document.title = "Quest compléter QCM";
        } else {
            await demanderConfigurationInitiale();
        }
    } catch (error) {
        console.error(error);
        afficherErreur(error.message || "Initialisation impossible.");
        window.location.href = PAGE_MENU;
        return;
    }

    window.initialiserEditeurQuest({
        etat: etatCreation,
        langue: false,
        construire: construireQuestion,
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
