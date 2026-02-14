#!/usr/bin/env python3
"""Script de réparation des questionnaires de langue.

Ce script recherche les fichiers JSON de type "langue" dans le dossier
AppData/Roaming/projet-snake/quest (y compris ses sous-dossiers), propose un choix à l'utilisateur,
puis complète les traductions manquantes afin que chaque mot possède
une traduction inverse.
"""

from __future__ import annotations

import argparse
import json
import os
from collections import defaultdict
from pathlib import Path
from typing import Iterable


def obtenir_dossier_par_defaut() -> Path:
    appdata = os.environ.get("APPDATA")
    if appdata:
        return Path(appdata) / "projet-snake" / "quest"
    return Path.home() / "AppData" / "Roaming" / "projet-snake" / "quest"


def normaliser_cle(valeur: str) -> str:
    return "".join(str(valeur).lower().split()).replace("_", "")


def trouver_cle_langue(objet: dict, cible: str) -> str | None:
    if not isinstance(objet, dict):
        return None
    cible_norm = normaliser_cle(cible)
    for cle in objet.keys():
        if normaliser_cle(cle) == cible_norm:
            return cle
    return None


def normaliser_liste(valeur) -> list[str]:
    if valeur is None:
        return []
    if isinstance(valeur, list):
        elements = valeur
    elif isinstance(valeur, dict):
        elements = list(valeur.values())
    else:
        elements = [valeur]
    resultat = []
    for element in elements:
        if element is None:
            continue
        texte = str(element).strip()
        if texte:
            resultat.append(texte)
    return resultat


def ajouter_paires(source: str, traductions: Iterable[str], cible: defaultdict[str, set[str]]):
    for traduction in traductions:
        cible[traduction].add(source)


def collecter_depuis_langues(langue_source, langue_cible, map_source, map_cible):
    if isinstance(langue_source, dict):
        for mot, traductions in langue_source.items():
            traductions_net = normaliser_liste(traductions)
            map_source[mot].update(traductions_net)
            ajouter_paires(mot, traductions_net, map_cible)
        return
    if isinstance(langue_source, list):
        if isinstance(langue_cible, list):
            limite = min(len(langue_source), len(langue_cible))
            for index in range(limite):
                mot = str(langue_source[index]).strip()
                traduction = str(langue_cible[index]).strip()
                if mot and traduction:
                    map_source[mot].add(traduction)
                    map_cible[traduction].add(mot)
        else:
            for mot in langue_source:
                texte = str(mot).strip()
                if texte:
                    map_source[texte]
        return
    if langue_source is not None:
        mot = str(langue_source).strip()
        if mot:
            map_source[mot]


def collecter_depuis_questionnaire(questionnaire: list, map_langue1, map_langue2):
    for entree in questionnaire:
        if not isinstance(entree, dict):
            continue
        cle_langue1 = trouver_cle_langue(entree, "langue 1")
        cle_langue2 = trouver_cle_langue(entree, "langue 2")
        if cle_langue1:
            source = entree[cle_langue1]
            cible = entree.get(cle_langue2) if cle_langue2 else None
            if isinstance(source, dict):
                for mot, traductions in source.items():
                    traductions_effectives = traductions
                    if isinstance(cible, dict) and mot in cible:
                        traductions_effectives = cible[mot]
                    traductions_net = normaliser_liste(traductions_effectives)
                    map_langue1[mot].update(traductions_net)
                    ajouter_paires(mot, traductions_net, map_langue2)
            else:
                traductions_net = normaliser_liste(cible)
                mot = str(source).strip() if source is not None else ""
                if mot:
                    map_langue1[mot].update(traductions_net)
                    ajouter_paires(mot, traductions_net, map_langue2)
        if cle_langue2:
            source = entree[cle_langue2]
            cible = entree.get(cle_langue1) if cle_langue1 else None
            if isinstance(source, dict):
                for mot, traductions in source.items():
                    traductions_effectives = traductions
                    if isinstance(cible, dict) and mot in cible:
                        traductions_effectives = cible[mot]
                    traductions_net = normaliser_liste(traductions_effectives)
                    map_langue2[mot].update(traductions_net)
                    ajouter_paires(mot, traductions_net, map_langue1)
            else:
                traductions_net = normaliser_liste(cible)
                mot = str(source).strip() if source is not None else ""
                if mot:
                    map_langue2[mot].update(traductions_net)
                    ajouter_paires(mot, traductions_net, map_langue1)


def reparer_fichier(chemin: Path, backup: bool = True) -> tuple[int, int]:
    contenu_brut = chemin.read_text(encoding="utf-8")
    data = json.loads(contenu_brut)
    if not isinstance(data, dict):
        raise ValueError("Le fichier JSON ne contient pas un objet.")

    cle_langue1 = trouver_cle_langue(data, "langue 1")
    cle_langue2 = trouver_cle_langue(data, "langue 2")
    langue1 = data.get(cle_langue1) if cle_langue1 else None
    langue2 = data.get(cle_langue2) if cle_langue2 else None

    map_langue1: defaultdict[str, set[str]] = defaultdict(set)
    map_langue2: defaultdict[str, set[str]] = defaultdict(set)

    collecter_depuis_langues(langue1, langue2, map_langue1, map_langue2)
    collecter_depuis_langues(langue2, langue1, map_langue2, map_langue1)

    questionnaire = data.get("questionnaire")
    if isinstance(questionnaire, list):
        collecter_depuis_questionnaire(questionnaire, map_langue1, map_langue2)

    for mot, traductions in list(map_langue1.items()):
        for traduction in list(traductions):
            map_langue2[traduction].add(mot)
    for mot, traductions in list(map_langue2.items()):
        for traduction in list(traductions):
            map_langue1[traduction].add(mot)

    cle_langue1 = cle_langue1 or "langue 1"
    cle_langue2 = cle_langue2 or "langue 2"

    def trier(valeurs: set[str]) -> list[str]:
        return sorted(valeurs, key=lambda val: val.lower())

    data[cle_langue1] = {mot: trier(traductions) for mot, traductions in sorted(map_langue1.items())}
    data[cle_langue2] = {mot: trier(traductions) for mot, traductions in sorted(map_langue2.items())}

    if backup:
        sauvegarde = chemin.with_suffix(chemin.suffix + ".bak")
        sauvegarde.write_text(contenu_brut, encoding="utf-8")

    chemin.write_text(json.dumps(data, ensure_ascii=False, indent=4), encoding="utf-8")
    return len(map_langue1), len(map_langue2)


def lister_fichiers_langue(dossier: Path) -> list[Path]:
    fichiers = []
    for fichier in sorted(dossier.rglob("*.json")):
        try:
            contenu = json.loads(fichier.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if isinstance(contenu, dict) and contenu.get("type") == "langue":
            fichiers.append(fichier)
    return fichiers


def demander_choix(fichiers: list[Path]) -> Path:
    print("Fichiers de langue disponibles :")
    for index, fichier in enumerate(fichiers, start=1):
        print(f"  {index}. {fichier.name}")
    while True:
        choix = input("Choisissez un fichier (numéro ou nom) : ").strip()
        if choix.isdigit():
            index = int(choix)
            if 1 <= index <= len(fichiers):
                return fichiers[index - 1]
        else:
            for fichier in fichiers:
                if fichier.name == choix:
                    return fichier
        print("Choix invalide, réessayez.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Réparer un fichier JSON de langue.")
    parser.add_argument("--dir", dest="dossier", type=Path, help="Dossier des fichiers quest.")
    parser.add_argument(
        "--no-backup",
        dest="backup",
        action="store_false",
        help="Ne pas créer de sauvegarde .bak.",
    )
    parser.set_defaults(backup=True)
    args = parser.parse_args()

    dossier = args.dossier or obtenir_dossier_par_defaut()
    if not dossier.exists():
        print(f"Dossier introuvable : {dossier}")
        return 1

    fichiers = lister_fichiers_langue(dossier)
    if not fichiers:
        print("Aucun fichier JSON de type 'langue' trouvé.")
        return 1

    fichier = demander_choix(fichiers)
    try:
        nb_langue1, nb_langue2 = reparer_fichier(fichier, backup=args.backup)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Erreur lors de la réparation : {exc}")
        return 1

    print(
        "Réparation terminée. "
        f"Mots langue 1 : {nb_langue1}, mots langue 2 : {nb_langue2}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
