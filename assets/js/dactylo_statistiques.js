/*fichier JS de dactylo_statistiques.html*/
(() => {
    const canvas = document.getElementById("stats-chart");
    const emptyMessage = document.querySelector(".stats-empty");
    const stockageStatistiques = "dactylo_statistiques";
    const fichierStatistiques = "stat_dactylo.json";
    const nombreSemaines = 20;

    if (!canvas) return;

    let statsFileHandle = null;

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
            return await reponse.json();
        } catch {
            return { statistique_dactylo: [] };
        }
    };

    const parserDate = (valeur) => {
        if (!valeur || typeof valeur !== "string") return null;
        const [jour, mois, annee] = valeur.split("-").map((part) => Number(part));
        if (!jour || !mois || !annee) return null;
        const date = new Date(annee, mois - 1, jour);
        if (Number.isNaN(date.getTime())) return null;
        return date;
    };

    const obtenirDebutSemaine = (date) => {
        const debut = new Date(date);
        const jour = debut.getDay();
        const decalage = (jour + 6) % 7;
        debut.setDate(debut.getDate() - decalage);
        debut.setHours(0, 0, 0, 0);
        return debut;
    };

    const construireSemaines = (dateReference) => {
        const fin = obtenirDebutSemaine(dateReference);
        const debut = new Date(fin);
        debut.setDate(fin.getDate() - (nombreSemaines - 1) * 7);
        const semaines = [];
        for (let i = 0; i < nombreSemaines; i += 1) {
            const semaine = new Date(debut);
            semaine.setDate(debut.getDate() + i * 7);
            semaines.push(semaine);
        }
        return semaines;
    };

    const agregerSemaines = (statistiques) => {
        const semaines = construireSemaines(new Date());
        const debut = semaines[0];
        const fin = semaines[semaines.length - 1];
        const buckets = new Map();

        statistiques.forEach((stat) => {
            const date = parserDate(stat.date);
            const valeurMotsMinute = Number(stat["mot-min"]);
            const valeurMotsCorrects = Number(stat["mot-correct"]);
            if (
                !date ||
                (!Number.isFinite(valeurMotsMinute) && !Number.isFinite(valeurMotsCorrects))
            ) {
                return;
            }
            const semaine = obtenirDebutSemaine(date);
            if (semaine < debut || semaine > fin) return;
            const cle = semaine.toISOString();
            const actuel = buckets.get(cle) || {
                totalMotsMinute: 0,
                totalMotsCorrects: 0,
                count: 0,
            };
            if (Number.isFinite(valeurMotsMinute)) {
                actuel.totalMotsMinute += valeurMotsMinute;
            }
            if (Number.isFinite(valeurMotsCorrects)) {
                actuel.totalMotsCorrects += valeurMotsCorrects;
            }
            actuel.count += 1;
            buckets.set(cle, actuel);
        });

        const valeursMotsMinute = semaines.map((semaine) => {
            const bucket = buckets.get(semaine.toISOString());
            if (!bucket || bucket.count === 0) return 0;
            return Math.round(bucket.totalMotsMinute / bucket.count);
        });

        const valeursMotsCorrects = semaines.map((semaine) => {
            const bucket = buckets.get(semaine.toISOString());
            if (!bucket || bucket.count === 0) return 0;
            return Math.round(bucket.totalMotsCorrects / bucket.count);
        });

        return { semaines, valeursMotsMinute, valeursMotsCorrects };
    };

    const dessinerGraphique = (semaines, valeursMotsMinute, valeursMotsCorrects) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ratio = window.devicePixelRatio || 1;
        const largeur = canvas.clientWidth;
        const hauteur = canvas.clientHeight;
        canvas.width = largeur * ratio;
        canvas.height = hauteur * ratio;
        ctx.scale(ratio, ratio);

        ctx.clearRect(0, 0, largeur, hauteur);

        const padding = { top: 24, right: 24, bottom: 36, left: 48 };
        const innerWidth = largeur - padding.left - padding.right;
        const innerHeight = hauteur - padding.top - padding.bottom;

        const maxValeur = Math.max(1, ...valeursMotsMinute, ...valeursMotsCorrects);
        const pasGraduation = 10;
        const maxGraduation = Math.max(pasGraduation, Math.ceil(maxValeur / pasGraduation) * pasGraduation);
        const stepX = innerWidth / (valeursMotsMinute.length - 1 || 1);

        ctx.strokeStyle = "#ffffff2f";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#ffffffb5";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (let valeur = 0; valeur <= maxGraduation; valeur += pasGraduation) {
            const y = padding.top + innerHeight - (valeur / maxGraduation) * innerHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + innerWidth, y);
            ctx.stroke();
            ctx.fillText(`${valeur}`, padding.left - 8, y);
        }

        const dessinerSerie = (valeurs, couleurLigne, couleurPoint) => {
            ctx.strokeStyle = couleurLigne;
            ctx.lineWidth = 2;
            ctx.beginPath();
            valeurs.forEach((valeur, index) => {
                const x = padding.left + stepX * index;
                const y = padding.top + innerHeight - (valeur / maxGraduation) * innerHeight;
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            ctx.fillStyle = couleurPoint;
            valeurs.forEach((valeur, index) => {
                const x = padding.left + stepX * index;
                const y = padding.top + innerHeight - (valeur / maxGraduation) * innerHeight;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        dessinerSerie(valeursMotsMinute, "#7cc7ff", "#ffffff");
        dessinerSerie(valeursMotsCorrects, "#ff9f5b", "#ffd8b5");

        const legende = [
            { texte: "Mots/min", couleur: "#7cc7ff" },
            { texte: "Mots corrects", couleur: "#ff9f5b" },
        ];
        const legendeY = padding.top - 12;
        const largeurPastille = 14;
        const ecartLegende = 110;
        legende.forEach((item, index) => {
            const x = padding.left + index * ecartLegende;
            ctx.strokeStyle = item.couleur;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, legendeY);
            ctx.lineTo(x + largeurPastille, legendeY);
            ctx.stroke();

            ctx.fillStyle = "#ffffffd9";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(item.texte, x + largeurPastille + 6, legendeY);
        });

        ctx.fillStyle = "#ffffffb5";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const stepLabel = 4;
        semaines.forEach((semaine, index) => {
            if (index % stepLabel !== 0 && index !== semaines.length - 1) return;
            const label = semaine.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
            const x = padding.left + stepX * index;
            const y = padding.top + innerHeight + 8;
            ctx.fillText(label, x, y);
        });
    };

    const initialiser = async () => {
        const stats = await chargerStatistiques();
        const liste = Array.isArray(stats.statistique_dactylo)
            ? stats.statistique_dactylo
            : [];
        const { semaines, valeursMotsMinute, valeursMotsCorrects } = agregerSemaines(liste);

        const maxValeur = Math.max(...valeursMotsMinute, ...valeursMotsCorrects);
        if (emptyMessage) {
            emptyMessage.textContent =
                maxValeur === 0
                    ? "Aucune donnée enregistrée sur les 20 dernières semaines."
                    : "Moyenne hebdomadaire des mots/min et mots corrects (20 dernières semaines).";
        }

        dessinerGraphique(semaines, valeursMotsMinute, valeursMotsCorrects);
        window.addEventListener("resize", () =>
            dessinerGraphique(semaines, valeursMotsMinute, valeursMotsCorrects)
        );
    };

    initialiser();
})();
