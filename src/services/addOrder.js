import { db } from "../firebase";
import { collection, addDoc, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export const addNewOrder = async (orderData) => {
  const counterRef = doc(db, "config", "ordersCounter");

  // Vérifier si le compteur existe sinon créer
  const counterSnap = await getDoc(counterRef);
  if (!counterSnap.exists()) {
    await setDoc(counterRef, { lastNumber: 0 });
  }

  const lastNumber = counterSnap.exists() ? counterSnap.data().lastNumber : 0;
  const newNumber = lastNumber + 1;

  // Générer le numéro ALKNXXX
  const orderNumber = `ALKN${String(newNumber).padStart(3, "0")}`;

  // Ajouter la commande
  await addDoc(collection(db, "commandes"), {
    ...orderData,
    numeroCommande: orderNumber,
    createdAt: new Date(),
  });

  // Mettre à jour le compteur
  await updateDoc(counterRef, { lastNumber: newNumber });

  return orderNumber;
};
