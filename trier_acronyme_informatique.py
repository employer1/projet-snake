#!/usr/bin/env python3
"""
Trie le questionnaire des acronymes informatiques par ordre alphabétique
et vérifie les doublons dans les réponses.

Fichier cible :
quest/questionnaire/autre/acronyme_informatique.json
"""

from __future__ import annotations

import argparse
import json
import os
import unicodedata
from pathlib import Path


RELATIVE_TARGET = Path("quest/questionnaire/autre/acronyme_informatique.json")


def resoudre_racine_appdata(appdata: str | None) -> Path:
    if appdata:
        return Path(appdata)

    env_appdata = os.environ.get("APPDATA")
    if env_appdata:
        return Path(env_appdata) / "projet-snake"

    return Path.home() / "AppData" / "Roaming" / "projet-snake"


def extraire_reponse_texte(entree: dict[str, object]) -> str | None:
    reponse = entree.get("reponse")
    if reponse is None:
        return None

    valeurs = reponse if isinstance(reponse, list) else [reponse]

    for valeur in valeurs:
        texte = str(valeur).strip()
        if texte:
            return texte

    return None


def cle_tri_reponse(entree: object) -> tuple[int, str]:
    if not isinstance(entree, dict):
        return (1, "")

    texte_reponse = extraire_reponse_texte(entree)
    if texte_reponse is None:
        return (1, "")

    texte = texte_reponse.casefold()
    texte = unicodedata.normalize("NFKD", texte)

    texte_sans_accents = "".join(
        c for c in texte if not unicodedata.combining(c)
    )

    return (0, texte_sans_accents)


def normaliser_reponse(entree: object) -> str | None:
    if not isinstance(entree, dict):
        return None

    texte_reponse = extraire_reponse_texte(entree)
    if texte_reponse is None:
        return None

    return texte_reponse.casefold()


def verifier_doublons(questionnaire: list[object]) -> list[str]:
    frequences: dict[str, int] = {}
    libelles: dict[str, str] = {}

    for entree in questionnaire:
        cle = normaliser_reponse(entree)
        if cle is None:
            continue

        frequences[cle] = frequences.get(cle, 0) + 1
        libelles.setdefault(cle, extraire_reponse_texte(entree) or "")

    return sorted(
        libelles[cle] for cle, count in frequences.items() if count > 1
    )


def trier_questionnaire(chemin_json: Path):

    contenu = json.loads(chemin_json.read_text(encoding="utf-8"))

    questionnaire = contenu.get("questionnaire")
    if not isinstance(questionnaire, list):
        raise ValueError("Le champ 'questionnaire' doit être une liste.")

    doublons = verifier_doublons(questionnaire)

    if doublons:
        return len(questionnaire), 0, doublons

    avant = list(questionnaire)

    questionnaire.sort(key=cle_tri_reponse)

    nb_deplaces = sum(
        1 for i, entree in enumerate(questionnaire) if entree is not avant[i]
    )

    chemin_json.write_text(
        json.dumps(contenu, ensure_ascii=False, indent=4),
        encoding="utf-8"
    )

    return len(questionnaire), nb_deplaces, []


def main():

    parser = argparse.ArgumentParser(
        description="Trie le questionnaire des acronymes par ordre alphabétique."
    )

    parser.add_argument(
        "--appdata",
        help="Chemin vers le dossier projet-snake dans AppData"
    )

    args = parser.parse_args()

    racine = resoudre_racine_appdata(args.appdata)

    cible = racine / RELATIVE_TARGET

    if not cible.exists():
        print(f"Fichier introuvable : {cible}")
        return 1

    total, deplaces, doublons = trier_questionnaire(cible)

    if doublons:
        print(
            "Doublons détectés dans les réponses (tri annulé):\n"
            + "\n".join(f"- {mot}" for mot in doublons)
        )
        return 1

    print(f"Tri terminé : {total} entrées, {deplaces} positions modifiées.")
    print(f"Fichier : {cible}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())