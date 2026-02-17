/*fichier JS de dactylo_menu.html*/
(() => {
    const boutonDemarrer = document.getElementById("demarrer");
    if (!boutonDemarrer) return;

    boutonDemarrer.addEventListener("click", () => {
        sessionStorage.removeItem("dactylo_pause");
        sessionStorage.removeItem("dactylo_state");
        sessionStorage.removeItem("dactylo_resultats");
    });
})();
