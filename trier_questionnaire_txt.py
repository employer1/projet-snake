#!/usr/bin/env python3
"""Choisit et trie un questionnaire txt du projet, sans écrire en cas de doublons.

Le tri ignore la casse et les accents. Pour une liste de réponses, sa première
valeur non vide sert au tri ; toutes ses valeurs sont vérifiées pour les doublons.
Les doublons ignorent la casse et les espaces en début et fin, mais pas les accents.
"""

from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path

from corriger_questionnaire_langue import charger_sans_doublons


def obtenir_dossier_par_defaut() -> Path:
    return Path(__file__).resolve().parent / "module" / "quest" / "questionnaire"


def lister_fichiers_txt(dossier: Path) -> list[Path]:
    fichiers = []
    for fichier in sorted(dossier.rglob("*.json")):
        try:
            contenu = json.loads(fichier.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        if isinstance(contenu, dict) and contenu.get("type") == "txt":
            fichiers.append(fichier)
    return fichiers


def demander_choix(options: list[str], message: str) -> int:
    for index, option in enumerate(options, start=1):
        print(f"  {index}. {option}")
    while True:
        choix = input(message).strip()
        if choix in options:
            return options.index(choix)
        if choix.isdigit() and 1 <= int(choix) <= len(options):
            return int(choix) - 1
        print("Choix invalide, réessayez.")


def charger_questionnaire(chemin: Path) -> dict:
    contenu = charger_sans_doublons(chemin.read_text(encoding="utf-8"))
    if not isinstance(contenu, dict) or contenu.get("type") != "txt":
        raise ValueError("Le fichier doit être un questionnaire de type 'txt'.")
    questionnaire = contenu.get("questionnaire")
    if not isinstance(questionnaire, list):
        raise ValueError("Le champ 'questionnaire' doit être une liste.")
    if not questionnaire:
        raise ValueError("Le questionnaire est vide.")
    if not all(isinstance(entree, dict) for entree in questionnaire):
        raise ValueError("Chaque entrée du questionnaire doit être un objet.")
    return contenu


def extraire_valeurs(entree: dict, champ: str) -> list[str]:
    valeur = entree.get(champ)
    valeurs = valeur if isinstance(valeur, list) else [valeur]
    resultat = []
    for valeur in valeurs:
        if valeur is None:
            continue
        if isinstance(valeur, (dict, list)):
            raise ValueError(f"Le champ '{champ}' contient une valeur complexe non triable.")
        texte = str(valeur).strip()
        if texte:
            resultat.append(texte)
    return resultat


def cle_tri(entree: dict, champ: str) -> tuple[int, str]:
    valeurs = extraire_valeurs(entree, champ)
    if not valeurs:
        return (1, "")
    texte = unicodedata.normalize("NFKD", valeurs[0].casefold())
    return (0, "".join(c for c in texte if not unicodedata.combining(c)))


def verifier_doublons(questionnaire: list[dict], champ: str) -> list[str]:
    occurrences: dict[str, list[int]] = {}
    libelles: dict[str, str] = {}
    for index, entree in enumerate(questionnaire, start=1):
        for texte in extraire_valeurs(entree, champ):
            cle = texte.casefold()
            occurrences.setdefault(cle, []).append(index)
            libelles.setdefault(cle, texte)
    return [
        f"{libelles[cle]} (entrées : {', '.join(map(str, indices))})"
        for cle, indices in occurrences.items() if len(indices) > 1
    ]


def trier_questionnaire(chemin_json: Path, champ: str = "question"):
    contenu = charger_questionnaire(chemin_json)
    questionnaire = contenu["questionnaire"]
    if not any(champ in entree for entree in questionnaire):
        raise ValueError(f"Champ inconnu : {champ}")
    doublons = verifier_doublons(questionnaire, champ)
    if doublons:
        return len(questionnaire), 0, doublons
    avant = list(questionnaire)
    questionnaire.sort(key=lambda entree: cle_tri(entree, champ))
    nb_deplaces = sum(entree is not avant[i] for i, entree in enumerate(questionnaire))
    chemin_json.write_text(json.dumps(contenu, ensure_ascii=False, indent=4), encoding="utf-8")
    return len(questionnaire), nb_deplaces, []


def main() -> int:
    parser = argparse.ArgumentParser(description="Choisir et trier un questionnaire de type txt.")
    parser.add_argument("--dir", type=Path, default=obtenir_dossier_par_defaut(),
                        help="Dossier à parcourir (défaut : module/quest/questionnaire du projet).")
    parser.add_argument("--file", type=Path, help="Choisir directement un fichier JSON de type txt.")
    args = parser.parse_args()
    try:
        cible = args.file
        if cible is None:
            if not args.dir.is_dir():
                raise ValueError(f"Dossier introuvable : {args.dir}")
            fichiers = lister_fichiers_txt(args.dir)
            if not fichiers:
                raise ValueError("Aucun fichier JSON de type 'txt' trouvé.")
            print("Questionnaires de type txt disponibles :")
            index = demander_choix([str(f.relative_to(args.dir)) for f in fichiers],
                                   "Choisissez un fichier (numéro ou chemin affiché) : ")
            cible = fichiers[index]
        contenu = charger_questionnaire(cible)
        champs = sorted({champ for entree in contenu["questionnaire"] for champ in entree})
        if not champs:
            raise ValueError("Aucun champ disponible pour le tri.")
        print(f"Fichier : {cible}")
        print("Champs disponibles pour le tri alphabétique :")
        champ = champs[demander_choix(champs, "Choisissez un champ (numéro ou nom) : ")]
        print("Listes : tri sur la première valeur non vide, doublons sur toutes les valeurs.")
        print("Les champs absents ou vides sont placés à la fin.")
        total, deplaces, doublons = trier_questionnaire(cible, champ)
        if doublons:
            print(f"Doublons détectés dans le champ '{champ}' :\n"
                  + "\n".join(f"- {valeur}" for valeur in doublons))
            print("Tri annulé. Le fichier n'a pas été modifié.")
            return 1
        print(f"Tri terminé sur '{champ}' : {total} entrées, {deplaces} positions modifiées.")
        return 0
    except (OSError, ValueError) as exc:
        print(f"Erreur : {exc}")
        return 1
    except (EOFError, KeyboardInterrupt):
        print("\nTri annulé.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
