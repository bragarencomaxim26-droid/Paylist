// 1. On récupère les abonnements sauvegardés (ou une liste vide)
let abonnements = JSON.parse(localStorage.getItem("abonnements")) || [];

// Quel abonnement est en train d'être modifié ? (null = aucun)
let indexModification = null;

// 2. On récupère les éléments de la page
const champNom = document.getElementById("nom");
const champPrix = document.getElementById("prix");
const champFrequence = document.getElementById("frequence");
const champCategorie = document.getElementById("categorie");
const champDate = document.getElementById("date-paiement");
const boutonAjouter = document.getElementById("bouton-ajouter");
const boutonAnnuler = document.getElementById("bouton-annuler");
const titreFormulaire = document.getElementById("titre-formulaire");
const liste = document.getElementById("liste");
const messageVide = document.getElementById("vide");
const messageErreur = document.getElementById("erreur");
const totalMois = document.getElementById("total-mois");
const totalAn = document.getElementById("total-an");
const repartition = document.getElementById("repartition");
const alertes = document.getElementById("alertes");

// 3. Fonction pour écrire un montant joliment
function formaterEuros(valeur) {
  return valeur.toFixed(2).replace(".", ",") + " €";
}

// 4. Fonction qui sauvegarde dans le navigateur
function sauvegarder() {
  localStorage.setItem("abonnements", JSON.stringify(abonnements));
}

// 5. Fonction qui convertit un prix en prix par mois
function prixParMois(abo) {
  return abo.frequence === "an" ? abo.prix / 12 : abo.prix;
}

// 6. Fonction qui calcule la prochaine date de paiement
function prochaineDate(abo) {
  if (!abo.date) {
    return null;
  }

  const morceaux = abo.date.split("-");
  const date = new Date(morceaux[0], morceaux[1] - 1, morceaux[2]);

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  while (date < aujourdhui) {
    if (abo.frequence === "an") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
  }
  return date;
}

// 7. Fonction qui calcule le nombre de jours avant une date
function joursRestants(date) {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return Math.round((date - aujourdhui) / 86400000);
}

// 8. Fonction qui écrit "aujourd'hui", "demain" ou "dans X jours"
function texteDelai(jours) {
  if (jours === 0) {
    return "aujourd'hui";
  }
  if (jours === 1) {
    return "demain";
  }
  return "dans " + jours + " jours";
}

// 9. Fonction qui affiche les alertes
function afficherAlertes() {
  alertes.innerHTML = "";
  const liste7jours = [];

  abonnements.forEach(function (abo) {
    const date = prochaineDate(abo);
    if (date === null) {
      return;
    }
    const jours = joursRestants(date);
    if (jours <= 7) {
      liste7jours.push({ abo: abo, jours: jours });
    }
  });

  liste7jours.sort(function (a, b) {
    return a.jours - b.jours;
  });

  liste7jours.forEach(function (element) {
    const alerte = document.createElement("div");
    alerte.className = "alerte" + (element.jours <= 2 ? " alerte-urgente" : "");
    alerte.textContent =
      "⏰ " + element.abo.nom + " se renouvelle " + texteDelai(element.jours) +
      " (" + formaterEuros(element.abo.prix) + ")";
    alertes.appendChild(alerte);
  });
}

// 10. Fonction qui affiche le graphique par catégorie
function afficherRepartition(mensuel) {
  repartition.innerHTML = "";

  if (abonnements.length === 0) {
    repartition.innerHTML = '<p class="vide">Ajoute un abonnement pour voir le graphique.</p>';
    return;
  }

  const parCategorie = {};
  abonnements.forEach(function (abo) {
    const categorie = abo.categorie || "Autre";
    parCategorie[categorie] = (parCategorie[categorie] || 0) + prixParMois(abo);
  });

  Object.keys(parCategorie).forEach(function (categorie) {
    const montant = parCategorie[categorie];
    const pourcentage = Math.round((montant / mensuel) * 100);

    const ligne = document.createElement("div");
    ligne.className = "ligne-cat";
    ligne.innerHTML =
      '<div class="ligne-cat-texte">' +
        '<span>' + categorie + '</span>' +
        '<span>' + formaterEuros(montant) + ' / mois (' + pourcentage + ' %)</span>' +
      '</div>' +
      '<div class="barre-fond">' +
        '<div class="barre-remplie" style="width:' + pourcentage + '%"></div>' +
      '</div>';
    repartition.appendChild(ligne);
  });
}

// 11. Fonction qui affiche tout à l'écran
function afficher() {
  liste.innerHTML = "";
  let mensuel = 0;

  abonnements.forEach(function (abo, index) {
    mensuel += prixParMois(abo);

    const date = prochaineDate(abo);
    const texteDate = date
      ? " · Prochain paiement : " + date.toLocaleDateString("fr-FR")
      : "";

    const ligne = document.createElement("li");
    ligne.innerHTML =
      '<div>' +
        '<div class="nom-abo">' + abo.nom + '</div>' +
        '<div class="detail-abo">' +
          formaterEuros(abo.prix) + ' par ' + abo.frequence +
          ' · ' + (abo.categorie || "Autre") + texteDate +
        '</div>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="modifier" data-index="' + index + '">Modifier</button>' +
        '<button class="supprimer" data-index="' + index + '">Supprimer</button>' +
      '</div>';
    liste.appendChild(ligne);
  });

  messageVide.style.display = abonnements.length === 0 ? "block" : "none";
  totalMois.textContent = formaterEuros(mensuel);
  totalAn.textContent = formaterEuros(mensuel * 12);
  afficherRepartition(mensuel);
  afficherAlertes();
}

// 12. Fonction qui remet le formulaire à zéro
function reinitialiserFormulaire() {
  champNom.value = "";
  champPrix.value = "";
  champFrequence.value = "mois";
    champCategorie.value = "Vidéo et séries";
  champDate.value = "";
  messageErreur.textContent = "";

  indexModification = null;
  boutonAjouter.textContent = "Ajouter";
  boutonAnnuler.style.display = "none";
  titreFormulaire.textContent = "Ajouter un abonnement";
}

// 13. Quand on clique sur "Ajouter" (ou "Enregistrer")
boutonAjouter.addEventListener("click", function () {
  const nom = champNom.value.trim();
  const prix = parseFloat(champPrix.value);

  if (nom === "" || isNaN(prix) || prix <= 0) {
    messageErreur.textContent = "Écris un nom et un prix valide.";
    return;
  }

 // Limite de l'offre gratuite : 5 abonnements
  if (indexModification === null && abonnements.length >= 5) {
    messageErreur.textContent =
      "Tu as atteint la limite gratuite de 5 abonnements. Premium (illimité) arrive bientôt !";
    return;
  }

  const abonnement = {
    nom: nom,
    prix: prix,
    frequence: champFrequence.value,
    categorie: champCategorie.value,
    date: champDate.value
  };

  if (indexModification === null) {
    abonnements.push(abonnement);
  } else {
    abonnements[indexModification] = abonnement;
  }

  sauvegarder();
  reinitialiserFormulaire();
  afficher();
});

// 14. Quand on clique sur "Annuler"
boutonAnnuler.addEventListener("click", function () {
  reinitialiserFormulaire();
});

// 15. Quand on clique sur "Modifier" ou "Supprimer" dans la liste
liste.addEventListener("click", function (evenement) {
  const index = Number(evenement.target.getAttribute("data-index"));

  if (evenement.target.classList.contains("supprimer")) {
    abonnements.splice(index, 1);
    sauvegarder();
    reinitialiserFormulaire();
    afficher();
  }

  if (evenement.target.classList.contains("modifier")) {
    const abo = abonnements[index];

    champNom.value = abo.nom;
    champPrix.value = abo.prix;
    champFrequence.value = abo.frequence;
    champCategorie.value = abo.categorie || "Autre";
    champDate.value = abo.date || "";

    indexModification = index;
    boutonAjouter.textContent = "Enregistrer";
    boutonAnnuler.style.display = "inline-block";
    titreFormulaire.textContent = "Modifier l'abonnement";
    titreFormulaire.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

// 16. Affichage au chargement de la page
afficher();