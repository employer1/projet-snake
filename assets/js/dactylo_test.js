/*fichier JS de dactylo_test.html*/
(() => {
    const chronoElement = document.getElementById("chrono");
    const texteElement = document.getElementById("texte_genere");
    const champTexte = document.querySelector("input.champ_texte");
    const boutonMenu = document.querySelector(".bouton_menu .btn-text[data-page]");
    const boutonParametres = document.querySelector(".bouton_param .btn-text[data-page]");
    const boutonAbandonner = document.querySelector(".bouton_petit[data-page]");
    const totalMots = 400;
    const nombreMotsAffiches = 10;
    const dureeInitiale = 60;
    const stockageCle = "dactylo_state";
    const stockageResultats = "dactylo_resultats";
    const stockagePause = "dactylo_pause";
    const stockageStatistiques = "dactylo_statistiques";
    const fichierStatistiques = "stat_dactylo.json";

    if (!chronoElement || !texteElement || !champTexte) return;

    let mots = [];
    let indexMot = 0;
    let compteurMots = 0;
    let compteurErreurs = 0;
    let secondesRestantes = dureeInitiale;
    let chronoInterval = null;
    let statsFileHandle = null;

    const formaterDate = (date) => {
        const jour = String(date.getDate()).padStart(2, "0");
        const mois = String(date.getMonth() + 1).padStart(2, "0");
        const annee = date.getFullYear();
        return `${jour}-${mois}-${annee}`;
    };

    const obtenirHandleStatistiques = async () => {
        if (!("storage" in navigator) || typeof navigator.storage.getDirectory !== "function") {
            return null;
        }
        if (!statsFileHandle) {
            const racine = await navigator.storage.getDirectory();
            statsFileHandle = await racine.getFileHandle(fichierStatistiques, { create: true });
        }
        return statsFileHandle;
    };

    const lireStatistiquesLocales = () => {
        const contenu = localStorage.getItem(stockageStatistiques);
        if (!contenu) return null;
        try {
            return JSON.parse(contenu);
        } catch {
            return null;
        }
    };

    const chargerStatistiques = async () => {
        if (window.electronAPI?.loadDactyloStats) {
            try {
                const statsElectron = await window.electronAPI.loadDactyloStats();
                if (statsElectron) {
                    return statsElectron;
                }
            } catch {
                // Fallbacks gérés plus bas.
            }
        }
        const handle = await obtenirHandleStatistiques();
        if (handle) {
            try {
                const fichier = await handle.getFile();
                if (fichier.size > 0) {
                    const contenu = await fichier.text();
                    return JSON.parse(contenu);
                }
            } catch {
                // Fallbacks gérés plus bas.
            }
        }

        const statsLocales = lireStatistiquesLocales();
        if (statsLocales) return statsLocales;

        try {
            const reponse = await fetch(`../dactylo/${fichierStatistiques}`, { cache: "no-store" });
            if (!reponse.ok) {
                return { statistique_dactylo: [] };
            }
            const contenu = await reponse.json();
            return contenu;
        } catch {
            return { statistique_dactylo: [] };
        }
    };

    const sauvegarderStatistiques = async (statistiques) => {
        if (window.electronAPI?.saveDactyloStats) {
            try {
                await window.electronAPI.saveDactyloStats(statistiques);
                return;
            } catch {
                // Fallbacks gérés plus bas.
            }
        }
        const handle = await obtenirHandleStatistiques();
        if (handle) {
            try {
                const writable = await handle.createWritable();
                await writable.write(JSON.stringify(statistiques, null, 4));
                await writable.close();
                return;
            } catch {
                // Fallback localStorage si l'écriture échoue.
            }
        }
        localStorage.setItem(stockageStatistiques, JSON.stringify(statistiques));
    };

    const enregistrerStatistiques = async ({ compteurMots, compteurErreurs }) => {
        const statistiques = await chargerStatistiques();
        const liste = Array.isArray(statistiques.statistique_dactylo)
            ? statistiques.statistique_dactylo
            : [];
        const motsCorrects = Math.max(compteurMots - compteurErreurs, 0);
        liste.push({
            date: formaterDate(new Date()),
            "mot-min": compteurMots,
            erreur: compteurErreurs,
            "mot-correct": motsCorrects,
        });
        statistiques.statistique_dactylo = liste;
        await sauvegarderStatistiques(statistiques);
    };

    const mettreAJourAffichage = () => {
        const debut = mots.slice(indexMot, indexMot + nombreMotsAffiches);
        texteElement.textContent = debut.join(" ");
    };

    const mettreAJourChrono = () => {
        chronoElement.textContent = `${secondesRestantes}s`;
    };

    const sauverEtat = () => {
        const etat = {
            mots,
            indexMot,
            compteurMots,
            compteurErreurs,
            secondesRestantes,
        };
        sessionStorage.setItem(stockageCle, JSON.stringify(etat));
    };

    const terminerTest = async () => {
        clearInterval(chronoInterval);
        sauverEtat();
        const resultats = {
            compteurMots,
            compteurErreurs,
        };
        sessionStorage.setItem(stockageResultats, JSON.stringify(resultats));
        sessionStorage.removeItem(stockageCle);
        await enregistrerStatistiques(resultats);
        window.location.href = "../pages/dactylo_resultats.html";
    };

    const demarrerChrono = () => {
        clearInterval(chronoInterval);
        mettreAJourChrono();
        chronoInterval = setInterval(() => {
            secondesRestantes -= 1;
            if (secondesRestantes <= 0) {
                secondesRestantes = 0;
                mettreAJourChrono();
                terminerTest();
                return;
            }
            mettreAJourChrono();
            sauverEtat();
        }, 1000);
    };

    const gererMotSaisi = () => {
        const motSaisi = champTexte.value.trim();
        champTexte.value = "";
        if (!motSaisi) return;
        const motAttendu = mots[indexMot] || "";
        compteurMots += 1;
        if (motSaisi !== motAttendu) {
            compteurErreurs += 1;
        }
        indexMot = Math.min(indexMot + 1, mots.length - 1);
        mettreAJourAffichage();
        sauverEtat();
    };

    const chargerMots = async () => {
        const reponse = await fetch("../dactylo/top_1000.txt");
        const texte = await reponse.text();
        const listeMots = texte
            .split(/\s+/)
            .map((mot) => mot.trim())
            .filter(Boolean);

        if (listeMots.length === 0) {
            throw new Error("Liste de mots vide.");
        }

        const motsAleatoires = Array.from({ length: totalMots }, () => {
            const index = Math.floor(Math.random() * listeMots.length);
            return listeMots[index];
        });
        return motsAleatoires;
    };

    const initialiserNouvelleSession = async () => {
        mots = await chargerMots();
        indexMot = 0;
        compteurMots = 0;
        compteurErreurs = 0;
        secondesRestantes = dureeInitiale;
        mettreAJourAffichage();
        mettreAJourChrono();
        champTexte.focus();
        sauverEtat();
        demarrerChrono();
    };

    const reprendreSession = (etat) => {
        mots = etat.mots || [];
        indexMot = Number.isFinite(etat.indexMot) ? etat.indexMot : 0;
        compteurMots = Number.isFinite(etat.compteurMots) ? etat.compteurMots : 0;
        compteurErreurs = Number.isFinite(etat.compteurErreurs) ? etat.compteurErreurs : 0;
        secondesRestantes = Number.isFinite(etat.secondesRestantes)
            ? etat.secondesRestantes
            : dureeInitiale;
        mettreAJourAffichage();
        mettreAJourChrono();
        champTexte.focus();
        demarrerChrono();
    };

    const enregistrerPause = () => {
        sessionStorage.setItem(stockagePause, "1");
        sauverEtat();
    };

    champTexte.addEventListener("keydown", (event) => {
        if (event.key === " ") {
            event.preventDefault();
            gererMotSaisi();
        }
    });

    boutonParametres?.addEventListener("click", enregistrerPause);
    boutonMenu?.addEventListener("click", () => {
        sessionStorage.removeItem(stockagePause);
        sessionStorage.removeItem(stockageCle);
        sessionStorage.removeItem(stockageResultats);
    });
    boutonAbandonner?.addEventListener("click", () => {
        sessionStorage.removeItem(stockagePause);
        sessionStorage.removeItem(stockageCle);
        sessionStorage.removeItem(stockageResultats);
    });

    const etatSauve = sessionStorage.getItem(stockageCle);
    const estEnPause = sessionStorage.getItem(stockagePause) === "1";
    if (etatSauve && estEnPause) {
        sessionStorage.removeItem(stockagePause);
        reprendreSession(JSON.parse(etatSauve));
    } else {
        sessionStorage.removeItem(stockagePause);
        sessionStorage.removeItem(stockageCle);
        sessionStorage.removeItem(stockageResultats);
        initialiserNouvelleSession().catch(() => {
            chronoElement.textContent = "Erreur de chargement.";
        });
    }
})();
