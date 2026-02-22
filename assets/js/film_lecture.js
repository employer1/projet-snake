/*fichier JS de la page film_lecture.html*/
const CLE_FICHIER_CLASSEMENT_FILM = "film_classement_fichier";

const selectClassement = document.querySelector(".choix");
const boutonConsulter = document.getElementById("demarrer");

const afficherOptionUnique = (message) => {
    if (!selectClassement) {
        return;
    }

    selectClassement.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = message;

    selectClassement.appendChild(option);
    selectClassement.disabled = true;
};

const chargerClassements = async () => {
    if (!selectClassement) {
        return;
    }

    if (!window.electronAPI?.listFilmClassements) {
        afficherOptionUnique("Lecture indisponible.");
        return;
    }

    try {
        const classements = await window.electronAPI.listFilmClassements();

        selectClassement.innerHTML = "";

        if (!Array.isArray(classements) || classements.length === 0) {
            afficherOptionUnique("Aucun classement disponible");
            return;
        }

        classements.forEach((fileName, index) => {
            const option = document.createElement("option");
            option.value = fileName;
            option.textContent = fileName;

            if (index === 0) {
                option.selected = true;
            }

            selectClassement.appendChild(option);
        });

        selectClassement.disabled = false;
    } catch (_error) {
        afficherOptionUnique("Impossible de charger les classements");
    }
};

const consulterClassement = () => {
    if (!selectClassement || !selectClassement.value) {
        return;
    }

    sessionStorage.setItem(CLE_FICHIER_CLASSEMENT_FILM, selectClassement.value);
    window.location.href = "../pages/film_consulter_classement.html";
};

if (boutonConsulter) {
    boutonConsulter.addEventListener("click", consulterClassement);
}

void chargerClassements();
