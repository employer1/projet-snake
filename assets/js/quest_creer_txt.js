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
    const dossierImages = window.prompt(
        "Chemin du dossier d'images existant (optionnel, laisser vide si aucun) :",
        ""
    );

    if (dossierImages && !await window.electronAPI?.directoryExists?.(dossierImages.trim())) {
        throw new Error("Le dossier d'images indiqué n'existe pas.");
    }

    const nomBrut = window.prompt("Nom du fichier JSON (ex: mon_questionnaire.json) :", "");
    const nomFichier = normaliserNomFichier(nomBrut || "");
    if (!nomFichier || nomFichier === ".json") {
        throw new Error("Nom de fichier invalide.");
    }

    const reverse = versEntierBinaire(window.prompt("Valeur reverse (0 ou 1) :", "0"));

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
    const nouveauNom = window.prompt(
        "Nom final du questionnaire JSON (laisser vide pour conserver le nom actuel):",
        etatCreation.jsonPath.split("/").pop() || ""
    );
    const nouveauReverse = versEntierBinaire(window.prompt("Reverse final (0 ou 1)", String(etatCreation.questionnaire.reverse)));

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
