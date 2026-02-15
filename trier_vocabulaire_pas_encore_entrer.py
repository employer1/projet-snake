import json
import os

fichier = "vocabulaire.json"

# Vérifier que le fichier existe
if not os.path.exists(fichier):
    print("Erreur : le fichier vocabulaire.json n'existe pas.")
    exit()

try:
    # Lecture du JSON
    with open(fichier, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Vérifier que c'est bien une liste
    if not isinstance(data, list):
        print("Erreur : le JSON ne contient pas un tableau.")
        exit()

    # Tri alphabétique
    data.sort(key=str.lower)

    # Écriture dans le fichier
    with open(fichier, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print("Tri alphabétique terminé.")

except json.JSONDecodeError:
    print("Erreur : le fichier JSON est invalide.")
