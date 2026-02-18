const CLE_MODE_FILM = "film_mode";
const MODE_DEFAUT = "battle_royal";

const configurationModes = {
    battle_royal: {
        titre: "Battle Royal",
        pageDemarrer: "../pages/film_battle_royal.html"
    },
    classement: {
        titre: "Classement",
        pageDemarrer: "../pages/film_consulter_classement.html"
    }
};

const modeSauvegarde = sessionStorage.getItem(CLE_MODE_FILM);
const modeActuel = configurationModes[modeSauvegarde] ? modeSauvegarde : MODE_DEFAUT;
const configuration = configurationModes[modeActuel];

const titre = document.querySelector("h1");
if (titre) {
    titre.textContent = configuration.titre;
}

const boutonDemarrer = document.getElementById("film-start-button");
if (boutonDemarrer) {
    boutonDemarrer.dataset.page = configuration.pageDemarrer;
}
