// =====================================================
//  PAYLIST : script.js
//  Les fonctions sont rangées en parties numérotées.
// =====================================================


// ---------- 1. DONNÉES ----------

// Les abonnements sauvegardés dans le navigateur (ou une liste vide)
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


// ---------- 2. ÉLÉMENTS DE LA PAGE ----------

// Formulaire
const titreFormulaire = document.getElementById("titre-formulaire");
const champNom = document.getElementById("nom");
const champPrix = document.getElementById("prix");
const champDevise = document.getElementById("devise");
const champFrequence = document.getElementById("frequence");
const champCategorie = document.getElementById("categorie");
const champDate = document.getElementById("date-paiement");
const boutonAjouter = document.getElementById("bouton-ajouter");
const boutonAnnuler = document.getElementById("bouton-annuler");
const messageErreur = document.getElementById("erreur");

// Affichage
const liste = document.getElementById("liste");
const messageVide = document.getElementById("vide");
const totalMois = document.getElementById("total-mois");
const totalAn = document.getElementById("total-an");
const repartition = document.getElementById("repartition");
const alertes = document.getElementById("alertes");

// Autres boutons
const champTri = document.getElementById("tri");
const boutonExport = document.getElementById("bouton-export");
const boutonPremier = document.getElementById("bouton-premier");
const boutonTheme = document.getElementById("bouton-theme");


// ---------- 3. FONCTIONS UTILES ----------

// Écrit un montant avec sa monnaie : 13,99 €
function formaterMontant(valeur, devise) {
  const code = devise || "EUR";
  const symbole = symboles[code] || code;
  return valeur.toFixed(2).replace(".", ",") + " " + symbole;
}

// Sauvegarde la liste dans le navigateur
function sauvegarder() {
  localStorage.setItem("abonnements", JSON.stringify(abonnements));
}

// Convertit le prix d'un abonnement en prix par mois
function prixParMois(abo) {
  return abo.frequence === "an" ? abo.prix / 12 : abo.prix;
}

// Calcule les totaux par mois, séparés par monnaie
function totauxParDevise() {
  const totaux = {};
  abonnements.forEach(function (abo) {
    const devise = abo.devise || "EUR";
    totaux[devise] = (totaux[devise] || 0) + prixParMois(abo);
  });
  return totaux;
}

// Écrit les totaux : "25,00 € + 10,00 $"
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

// Entoure un texte de guillemets (pour le fichier exporté)
function proteger(texte) {
  return '"' + String(texte).replace(/"/g, '""') + '"';
}


// ---------- 4. DATES ET ALERTES ----------

// Calcule la prochaine date de paiement d'un abonnement
function prochaineDate(abo) {
  if (!abo.date) {
    return null;
  }

  const morceaux = abo.date.split("-");
  const date = new Date(morceaux[0], morceaux[1] - 1, morceaux[2]);

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  // Si la date est passée, on avance d'un mois (ou d'un an)
  while (date < aujourdhui) {
    if (abo.frequence === "an") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
  }
  return date;
}

// Nombre de jours avant une date
function joursRestants(date) {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return Math.round((date - aujourdhui) / 86400000);
}

// Écrit "aujourd'hui", "demain" ou "dans X jours"
function texteDelai(jours) {
  if (jours === 0) {
    return "aujourd'hui";
  }
  if (jours === 1) {
    return "demain";
  }
  return "dans " + jours + " jours";
}

// Affiche les alertes de renouvellement (7 jours ou moins)
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

  // Les renouvellements les plus proches en premier
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


// ---------- 5. GRAPHIQUE PAR CATÉGORIE ----------

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


// ---------- 6. AFFICHAGE PRINCIPAL ----------

function afficher() {
  liste.innerHTML = "";

  // On garde l'index d'origine de chaque abonnement,
  // pour que "Modifier" et "Supprimer" visent toujours le bon
  const elements = abonnements.map(function (abo, index) {
    return { abo: abo, index: index };
  });

  // On trie selon le choix du menu
  const tri = champTri.value;
  elements.sort(function (a, b) {
    if (tri === "prix") {
      return prixParMois(b.abo) - prixParMois(a.abo);
    }

    if (tri === "nom") {
      return a.abo.nom.localeCompare(b.abo.nom, "fr");
    }

    if (tri === "date") {
      const dateA = prochaineDate(a.abo);
      const dateB = prochaineDate(b.abo);

      // Les abonnements sans date vont à la fin
      if (dateA === null && dateB === null) {
        return 0;
      }
      if (dateA === null) {
        return 1;
      }
      if (dateB === null) {
        return -1;
      }
      return dateA - dateB;
    }

    // Par défaut : ordre d'ajout
    return a.index - b.index;
  });

  // On crée une ligne pour chaque abonnement
  elements.forEach(function (element) {
    const abo = element.abo;
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
        '<button class="modifier" data-index="' + element.index + '">Modifier</button>' +
        '<button class="supprimer" data-index="' + element.index + '">Supprimer</button>' +
      '</div>';
    liste.appendChild(ligne);
  });

  // Totaux, écran vide, graphique et alertes
  const totaux = totauxParDevise();

  messageVide.style.display = abonnements.length === 0 ? "block" : "none";
  totalMois.textContent = texteTotaux(totaux, 1);
  totalAn.textContent = texteTotaux(totaux, 12);
  afficherRepartition();
  afficherAlertes();
}


// ---------- 7. FORMULAIRE ----------

// Remet le formulaire à zéro
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

// Clic sur "Ajouter" (ou "Enregistrer" en mode modification)
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

// Clic sur "Annuler"
boutonAnnuler.addEventListener("click", function () {
  reinitialiserFormulaire();
});

// Clic sur "Modifier" ou "Supprimer" dans la liste
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


// ---------- 8. TRI ----------

champTri.addEventListener("change", afficher);


// ---------- 9. ÉCRAN VIDE ----------

boutonPremier.addEventListener("click", function () {
  titreFormulaire.scrollIntoView({ behavior: "smooth", block: "center" });
  champNom.focus();
});


// ---------- 10. EXPORT (.csv) ----------

boutonExport.addEventListener("click", function () {
  if (abonnements.length === 0) {
    messageErreur.textContent = "Ajoute au moins un abonnement avant d'exporter.";
    return;
  }

  messageErreur.textContent = "";

  // La première ligne : les titres des colonnes
  const lignes = ["Nom;Prix;Monnaie;Frequence;Categorie;Prochain paiement"];

  abonnements.forEach(function (abo) {
    const date = prochaineDate(abo);
    const texteDate = date ? date.toLocaleDateString("fr-FR") : "";

    lignes.push([
      proteger(abo.nom),
      String(abo.prix).replace(".", ","),
      abo.devise || "EUR",
      abo.frequence,
      proteger(abo.categorie || "Autre"),
      texteDate
    ].join(";"));
  });

  // Le "\uFEFF" permet à Excel d'afficher correctement les accents
  const contenu = "\uFEFF" + lignes.join("\n");
  const fichier = new Blob([contenu], { type: "text/csv;charset=utf-8;" });

  // On crée un lien invisible et on clique dessus
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(fichier);
  lien.download = "mes-abonnements-paylist.csv";
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(lien.href);
});


// ---------- 11. MODE SOMBRE ----------

function appliquerTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  boutonTheme.textContent = theme === "dark" ? "☀️" : "🌙";
}

// On récupère le thème choisi la dernière fois (clair par défaut)
let themeActuel = "light";
try {
  themeActuel = localStorage.getItem("theme") || "light";
} catch (erreur) {
  themeActuel = "light";
}
appliquerTheme(themeActuel);

// Clic sur le bouton : on change de thème et on le sauvegarde
boutonTheme.addEventListener("click", function () {
  themeActuel = themeActuel === "dark" ? "light" : "dark";
  appliquerTheme(themeActuel);
  try {
    localStorage.setItem("theme", themeActuel);
  } catch (erreur) {
    // Si le navigateur refuse de sauvegarder, ce n'est pas grave
  }
});


// ---------- 12. DÉMARRAGE ----------

// Affichage au chargement de la page
afficher();