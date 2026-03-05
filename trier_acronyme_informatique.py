#!/usr/bin/env python3
"""Trie le questionnaire des acronymes informatiques.

Le script :
- vérifie les doublons sur le champ ``question`` ;
- trie les entrées par ordre alphabétique à partir de ``question``.
"""

from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path


RELATIVE_TARGET = Path("quest/questionnaire/autre/acronyme_informatique.json")


def extraire_question_texte(entree: dict[str, object]) -> str | None:
    question = entree.get("question")
    if question is None:
        return None

    texte = str(question).strip()
    if not texte:
        return None

    return texte


def cle_tri_question(entree: object) -> tuple[int, str]:
    if not isinstance(entree, dict):
        return (1, "")

    texte_question = extraire_question_texte(entree)
    if texte_question is None:
        return (1, "")

    texte = texte_question.casefold()
    texte = unicodedata.normalize("NFKD", texte)

    texte_sans_accents = "".join(
        c for c in texte if not unicodedata.combining(c)
    )

    return (0, texte_sans_accents)


def normaliser_question(entree: object) -> str | None:
    if not isinstance(entree, dict):
        return None

    texte_question = extraire_question_texte(entree)
    if texte_question is None:
        return None

    return texte_question.casefold()


def verifier_doublons(questionnaire: list[object]) -> list[str]:
    frequences: dict[str, int] = {}
    libelles: dict[str, str] = {}

    for entree in questionnaire:
        cle = normaliser_question(entree)
        if cle is None:
            continue

        frequences[cle] = frequences.get(cle, 0) + 1
        libelles.setdefault(cle, extraire_question_texte(entree) or "")

    return sorted(
        libelles[cle] for cle, count in frequences.items() if count > 1
    )


def trier_questionnaire(chemin_json: Path):
    contenu = json.loads(chemin_json.read_text(encoding="utf-8"))

    questionnaire = contenu.get("questionnaire")
    if not isinstance(questionnaire, list):
        raise ValueError("Le champ 'questionnaire' doit être une liste.")

    doublons = verifier_doublons(questionnaire)

    avant = list(questionnaire)

    questionnaire.sort(key=cle_tri_question)

    nb_deplaces = sum(
        1 for i, entree in enumerate(questionnaire) if entree is not avant[i]
    )

    chemin_json.write_text(
        json.dumps(contenu, ensure_ascii=False, indent=4),
        encoding="utf-8"
    )

    return len(questionnaire), nb_deplaces, doublons


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Vérifie les doublons et trie le questionnaire des acronymes "
            "par ordre alphabétique sur le champ question."
        )
    )

    parser.add_argument(
        "--file",
        type=Path,
        default=RELATIVE_TARGET,
        help=(
            "Chemin du fichier JSON à traiter "
            "(défaut : quest/questionnaire/autre/acronyme_informatique.json)"
        ),
    )

    args = parser.parse_args()

    cible = args.file

    if not cible.exists():
        print(f"Fichier introuvable : {cible}")
        return 1

    total, deplaces, doublons = trier_questionnaire(cible)

    if doublons:
        print(
            "Doublons détectés dans les questions :\n"
            + "\n".join(f"- {mot}" for mot in doublons)
        )

    print(f"Tri terminé : {total} entrées, {deplaces} positions modifiées.")
    print(f"Fichier : {cible}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
