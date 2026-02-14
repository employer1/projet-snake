/*fichier JS de dactylo_resultats.html*/
(() => {
    const motMinuteElement = document.querySelector("#mot_minute span");
    const erreurMotElement = document.querySelector("#erreur_mot span");
    const motsCorrectsElement = document.querySelector("#mots_corrects span");
    const stockageResultats = "dactylo_resultats";

    if (!motMinuteElement || !erreurMotElement || !motsCorrectsElement) return;

    const resultats = sessionStorage.getItem(stockageResultats);
    if (!resultats) {
        motMinuteElement.textContent = "0";
        erreurMotElement.textContent = "0";
        motsCorrectsElement.textContent = "0";
        return;
    }

    const { compteurMots = 0, compteurErreurs = 0 } = JSON.parse(resultats);
    motMinuteElement.textContent = `${compteurMots}`;
    erreurMotElement.textContent = `${compteurErreurs}`;
    const motsCorrects = Math.max(compteurMots - compteurErreurs, 0);
    motsCorrectsElement.textContent = `${motsCorrects}`;
})();
