/*fichier JS de daily-note_rechercher.html*/

const stockageDailyNoteSelection = "daily_note_selection";
const stockageDailyNoteContenu = "daily_note_contenu";

const creerMessage = (texte) => {
    const message = document.createElement("p");
    message.className = "message-vide";
    message.textContent = texte;
    return message;
};

const afficherResultats = (resultats) => {
    const conteneur = document.getElementById("daily-note-search-results");
    if (!conteneur) {
        return;
    }

    conteneur.innerHTML = "";

    if (!Array.isArray(resultats) || resultats.length === 0) {
        conteneur.appendChild(creerMessage("Aucun fichier trouvé pour ce tag."));
        return;
    }

    resultats.forEach((resultat) => {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "exemple";

        const titre = document.createElement("h4");
        titre.textContent = resultat.fileName;
        bouton.appendChild(titre);

        const texte = document.createElement("p");
        texte.textContent = `Cliquer pour ouvrir la note ${resultat.titre}.`;
        bouton.appendChild(texte);

        bouton.addEventListener("click", async () => {
            localStorage.setItem(stockageDailyNoteSelection, resultat.fileName);
            localStorage.removeItem(stockageDailyNoteContenu);

            if (window.electronAPI?.openOrCreateDailyNote) {
                try {
                    const contenu = await window.electronAPI.openOrCreateDailyNote(resultat.fileName, { histoire: [] });
                    localStorage.setItem(stockageDailyNoteContenu, JSON.stringify(contenu?.content ?? { histoire: [] }));
                } catch (error) {
                    console.error("Impossible de charger la note", error);
                }
            }

            window.location.href = "../pages/daily-note_lecture.html";
        });

        conteneur.appendChild(bouton);
    });
};

const chargerTags = async () => {
    const select = document.getElementById("daily-note-tag-select");
    if (!select) {
        return;
    }

    let tags = [];
    if (window.electronAPI?.listDailyNoteTags) {
        try {
            tags = await window.electronAPI.listDailyNoteTags();
        } catch (error) {
            console.error("Impossible de charger les tags", error);
        }
    }

    tags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        select.appendChild(option);
    });
};

const lancerRecherche = async (tag) => {
    const conteneur = document.getElementById("daily-note-search-results");
    if (!conteneur) {
        return;
    }

    if (!tag) {
        conteneur.innerHTML = "";
        conteneur.appendChild(creerMessage("Sélectionnez un tag pour afficher les notes."));
        return;
    }

    let resultats = [];
    if (window.electronAPI?.listDailyNotesByTag) {
        try {
            resultats = await window.electronAPI.listDailyNotesByTag(tag);
        } catch (error) {
            console.error("Impossible de rechercher les notes", error);
        }
    }

    afficherResultats(resultats);
};

const initialiserPageRecherche = async () => {
    await chargerTags();
    await lancerRecherche("");

    const select = document.getElementById("daily-note-tag-select");
    if (!select) {
        return;
    }

    select.addEventListener("change", () => {
        void lancerRecherche(select.value);
    });
};

document.addEventListener("DOMContentLoaded", () => {
    void initialiserPageRecherche();
});
