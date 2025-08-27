// scripts/copy-redirects.js
const fs = require("fs");
const path = require("path");

const redirectsContent = "/*    /index.html   200\n";
const distPath = path.join(__dirname, "..", "dist");
const redirectsFile = path.join(distPath, "_redirects");

try {
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }

  fs.writeFileSync(redirectsFile, redirectsContent);
  console.log("✅ Fichier _redirects généré avec succès.");
} catch (error) {
  console.error("❌ Erreur création _redirects :", error);
  process.exit(1);
}
