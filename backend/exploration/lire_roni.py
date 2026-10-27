

observations = []

with open("../../data/raw/roni_2026-10-27.txt", encoding="utf-8") as fichier:
    for ligne in fichier:
        morceaux = ligne.split()
        if morceaux[0] == "SEAS":                      
            continue
        saison = morceaux[0]
        annee = int(morceaux[1])
        anom = float(morceaux[2])
        observation = {"saison": saison, "annee": annee, "anom": anom}
        observations.append(observation)

print(len(observations))
print(observations[0])
print(observations[-1])