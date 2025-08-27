const fs = require("fs");
const { exec } = require("child_process");

const frContent = {
  "welcome": "Bienvenue",
  "login": "Se connecter",
  "logout": "Se déconnecter",
  "dashboard": "Tableau de bord",
  "statistiques": "Statistiques",
  "orders": "Commandes",
  "orderDetails": "Détail de la commande",
  "addOrder": "Ajouter une commande",
  "editOrder": "Modifier une commande",
  "clients": "Clients",
  "addClient": "Ajouter un client",
  "editClient": "Modifier un client",
  "finances": "Finances",
  "adminPanel": "Panneau d'administration",
  "cotations": "Cotations",
  "produitsEvalues": "Produits évalués",
  "modifierProduit": "Modifier produit",
  "save": "Sauvegarder",
  "delete": "Supprimer",
  "statusUpdated": "✅ État mis à jour",
  "total": "Total",
  "invoice": "Facture",
  "client": "Client",
  "date": "Date",
  "estimatedDelivery": "Livraison estimée",
  "products": "Produits",
  "quantity": "Quantité",
  "unitPrice": "Prix unitaire",
  "pdf": "Générer PDF",
  "back": "Retour",
  "notFound": "Page non trouvée (Erreur 404)",
  "voirPlus": "Voir plus →",
  "etat": "État"
};

const enContent = {
  "welcome": "Welcome",
  "login": "Login",
  "logout": "Logout",
  "dashboard": "Dashboard",
  "statistiques": "Statistics",
  "orders": "Orders",
  "orderDetails": "Order details",
  "addOrder": "Add order",
  "editOrder": "Edit order",
  "clients": "Clients",
  "addClient": "Add client",
  "editClient": "Edit client",
  "finances": "Finances",
  "adminPanel": "Admin panel",
  "cotations": "Quotations",
  "produitsEvalues": "Evaluated products",
  "modifierProduit": "Edit product",
  "save": "Save",
  "delete": "Delete",
  "statusUpdated": "✅ Status updated",
  "total": "Total",
  "invoice": "Invoice",
  "client": "Client",
  "date": "Date",
  "estimatedDelivery": "Estimated delivery",
  "products": "Products",
  "quantity": "Quantity",
  "unitPrice": "Unit price",
  "pdf": "Generate PDF",
  "back": "Back",
  "notFound": "Page not found (Error 404)",
  "voirPlus": "See more →",
  "etat": "Status"
};

const createFolderAndFile = (lang, content) => {
  const dir = `src/locales/${lang}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(`${dir}/translation.json`, JSON.stringify(content, null, 2));
  console.log(`✅ ${lang}/translation.json créé`);
};

// Création des fichiers
createFolderAndFile("fr", frContent);
createFolderAndFile("en", enContent);

// Installation des dépendances
console.log("📦 Installation de react-i18next, i18next, i18next-browser-languagedetector...");
exec("npm install react-i18next i18next i18next-browser-languagedetector", (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Erreur installation: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`⚠️ Erreurs: ${stderr}`);
    return;
  }
  console.log(`✅ Installation terminée:\n${stdout}`);
});
