// test-firestore.js
import { db } from "./firebase"; // ton fichier firebase.js existant
import { collection, getDocs } from "firebase/firestore";

async function testFirestore() {
  try {
    const path = "artifacts/default-app-id/transactions";
    console.log("🔹 Test du chemin Firestore :", path);

    const snap = await getDocs(collection(db, path));

    console.log("📄 Nombre de documents trouvés :", snap.size);
    if (snap.empty) {
      console.log("⚠️ Aucun document trouvé !");
    } else {
      snap.docs.forEach(doc => {
        console.log("ID:", doc.id, "=>", doc.data());
      });
    }

  } catch (err) {
    console.error("❌ Erreur Firestore :", err);
  }
}

// Exécution
testFirestore();
