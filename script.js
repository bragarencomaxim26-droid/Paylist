// 1. On récupère les abonnements sauvegardés (ou une liste vide)
let abonnements = JSON.parse(localStorage.getItem("abonnements")) || [];

// Quel abonnement est en train d'être modifié ? (null = aucun)
let indexModification = null;

// Les monnaies disponibles : code -> symbole
const symboles = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  MDL: "lei"
};

// 2. On récupère les éléments de la page
const champNom = document.getElementById("nom");
const champPrix = document.getElementById("prix");
const champDevise = document.getElementById("devise");
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

// 3. Fonction pour écrire un montant avec sa monnaie
function formaterMontant(valeur, devise) {
  const code = devise || "EUR";
  const symbole = symboles[code] || code;
  return valeur.toFixed(2).replace(".", ",") + " " + symbole;
}

// 4. Fonction qui sauvegarde dans le navigateur
function sauvegarder() {
  localStorage.setItem("abonnements", JSON.stringify(abonnements));
}

// 5. Fonction qui convertit un prix en prix par mois
function prixParMois(abo) {
  return abo.frequence === "an" ? abo.prix / 12 : abo.prix;
}

// 6. Fonction qui calcule les totaux par mois, séparés par monnaie
function totauxParDevise() {
  const totaux = {};
  abonnements.forEach(function (abo) {
    const devise = abo.devise || "EUR";
    totaux[devise] = (totaux[devise] || 0) + prixParMois(abo);
  });
  return totaux;
}

// 7. Fonction qui écrit les totaux : "25,00 € + 10,00 $"
function texteTotaux(totaux, multiplicateur) {
  const devises = Object.keys(totaux);

  if (devises.length === 0) {
    return formaterMontant(0, "EUR");
  }

  return devises
    .map(function (devise) {
      return formaterMontant(totaux[devise] * multiplicateur, devise);
    })
    .join(" + ");
}

// 8. Fonction qui calcule la prochaine date de paiement
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

// 9. Fonction qui calcule le nombre de jours avant une date
function joursRestants(date) {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return Math.round((date - aujourdhui) / 86400000);
}

// 10. Fonction qui écrit "aujourd'hui", "demain" ou "dans X jours"
function texteDelai(jours) {
  if (jours === 0) {
    return "aujourd'hui";
  }
  if (jours === 1) {
    return "demain";
  }
  return "dans " + jours + " jours";
}

// 11. Fonction qui affiche les alertes
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
      " (" + formaterMontant(element.abo.prix, element.abo.devise) + ")";
    alertes.appendChild(alerte);
  });
}

// 12. Fonction qui affiche le graphique par catégorie, un groupe par monnaie
function afficherRepartition() {
  repartition.innerHTML = "";

  if (abonnements.length === 0) {
    repartition.innerHTML = '<p class="vide">Ajoute un abonnement pour voir le graphique.</p>';
    return;
  }

  // On range les montants : devise -> catégorie -> montant par mois
  const donnees = {};
  abonnements.forEach(function (abo) {
    const devise = abo.devise || "EUR";
    const categorie = abo.categorie || "Autre";
    if (!donnees[devise]) {
      donnees[devise] = {};
    }
    donnees[devise][categorie] = (donnees[devise][categorie] || 0) + prixParMois(abo);
  });

  const devises = Object.keys(donnees);

  devises.forEach(function (devise) {
    // Un titre par monnaie, seulement s'il y en a plusieurs
    if (devises.length > 1) {
      const titre = document.createElement("div");
      titre.className = "titre-devise";
      titre.textContent = "En " + devise + " (" + symboles[devise] + ")";
      repartition.appendChild(titre);
    }

    // Le total de cette monnaie, pour calculer les pourcentages
    let totalDevise = 0;
    Object.keys(donnees[devise]).forEach(function (categorie) {
      totalDevise += donnees[devise][categorie];
    });

    Object.keys(donnees[devise]).forEach(function (categorie) {
      const montant = donnees[devise][categorie];
      const pourcentage = Math.round((montant / totalDevise) * 100);

      const ligne = document.createElement("div");
      ligne.className = "ligne-cat";
      ligne.innerHTML =
        '<div class="ligne-cat-texte">' +
          '<span>' + categorie + '</span>' +
          '<span>' + formaterMontant(montant, devise) + ' / mois (' + pourcentage + ' %)</span>' +
        '</div>' +
        '<div class="barre-fond">' +
          '<div class="barre-remplie" style="width:' + pourcentage + '%"></div>' +
        '</div>';
      repartition.appendChild(ligne);
    });
  });
}

// 13. Fonction qui affiche tout à l'écran
function afficher() {
  liste.innerHTML = "";

  abonnements.forEach(function (abo, index) {
    const date = prochaineDate(abo);
    const texteDate = date
      ? " · Prochain paiement : " + date.toLocaleDateString("fr-FR")
      : "";

    const ligne = document.createElement("li");
    ligne.innerHTML =
      '<div>' +
        '<div class="nom-abo">' + abo.nom + '</div>' +
        '<div class="detail-abo">' +
          formaterMontant(abo.prix, abo.devise) + ' par ' + abo.frequence +
          ' · ' + (abo.categorie || "Autre") + texteDate +
        '</div>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="modifier" data-index="' + index + '">Modifier</button>' +
        '<button class="supprimer" data-index="' + index + '">Supprimer</button>' +
      '</div>';
    liste.appendChild(ligne);
  });

  const totaux = totauxParDevise();

  messageVide.style.display = abonnements.length === 0 ? "block" : "none";
  totalMois.textContent = texteTotaux(totaux, 1);
  totalAn.textContent = texteTotaux(totaux, 12);
  afficherRepartition();
  afficherAlertes();
}

// 14. Fonction qui remet le formulaire à zéro
function reinitialiserFormulaire() {
  champNom.value = "";
  champPrix.value = "";
  champDevise.value = "EUR";
  champFrequence.value = "mois";
  champCategorie.value = "Vidéo et séries";
  champDate.value = "";
  messageErreur.textContent = "";

  indexModification = null;
  boutonAjouter.textContent = "Ajouter";
  boutonAnnuler.style.display = "none";
  titreFormulaire.textContent = "Ajouter un abonnement";
}

// 15. Quand on clique sur "Ajouter" (ou "Enregistrer")
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
    devise: champDevise.value,
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

// 16. Quand on clique sur "Annuler"
boutonAnnuler.addEventListener("click", function () {
  reinitialiserFormulaire();
});

// 17. Quand on clique sur "Modifier" ou "Supprimer" dans la liste
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
    champDevise.value = abo.devise || "EUR";
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

// 18. Affichage au chargement de la page
afficher();