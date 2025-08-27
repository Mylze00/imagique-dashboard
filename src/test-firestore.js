
// TODO: Remplacez cette configuration par la vôtre depuis la console Firebase.
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Étape 1: Initialisation de Firebase et Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testFirestore() {
  try {
    // Étape 2: Authentification de l'utilisateur
    console.log("🔐 Authentification de l'utilisateur...");
    await signInAnonymously(auth);
    console.log("✅ Authentification réussie (utilisateur anonyme).");

    const path = "artifacts/default-app-id/transactions"; // Utiliser un chemin complet
    console.log("🔹 Test du chemin Firestore :", path);

    // Étape 3: Récupération des documents
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

// Exécution de la fonction
testFirestore();