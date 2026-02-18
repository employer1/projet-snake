const CLE_MODE_FILM = "film_mode";

const routesParMode = {
    battle_royal: "../pages/film_selection.html",
    classement: "../pages/film_selection.html"
};

document.querySelectorAll("[data-film-mode]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
        const mode = bouton.dataset.filmMode;
        const page = routesParMode[mode];

        if (!page) {
            return;
        }

        sessionStorage.setItem(CLE_MODE_FILM, mode);
        window.location.href = page;
    });
});
