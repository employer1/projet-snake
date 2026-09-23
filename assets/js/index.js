const moduleList = document.getElementById("module-list");

const fallbackModules = [
    { name: "dactylo", page: "pages/dactylo/dactylo_menu.html" },
    { name: "daily-note", page: "pages/daily-note/daily-note_menu.html" },
    { name: "film", page: "pages/film/film_menu.html" },
    { name: "quest", page: "pages/quest/quest_menu.html" },
];

const formatterNomModule = (nom) => nom
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join(" ");

const creerCarteModule = (module) => {
    const carte = document.createElement("button");
    carte.className = "module-card";
    carte.type = "button";
    carte.dataset.page = module.page;
    carte.style.backgroundImage = "url('image/exemple.png')";
    carte.setAttribute("aria-label", `Ouvrir le module ${formatterNomModule(module.name)}`);

    const titre = document.createElement("span");
    titre.className = "module-card-title";
    titre.textContent = formatterNomModule(module.name);
    carte.appendChild(titre);

    carte.addEventListener("click", () => {
        window.location.href = module.page;
    });

    return carte;
};

const afficherModules = (modules) => {
    if (!moduleList) {
        return;
    }

    moduleList.innerHTML = "";

    if (modules.length === 0) {
        const message = document.createElement("p");
        message.className = "message_modules";
        message.textContent = "Aucun module disponible.";
        moduleList.appendChild(message);
        return;
    }

    modules.forEach((module) => {
        moduleList.appendChild(creerCarteModule(module));
    });
};

const chargerModules = async () => {
    try {
        const modules = window.electronAPI?.listModules
            ? await window.electronAPI.listModules()
            : fallbackModules;

        afficherModules(Array.isArray(modules) ? modules : []);
    } catch (error) {
        console.error("Impossible de charger les modules", error);
        afficherModules(fallbackModules);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    void chargerModules();
});
