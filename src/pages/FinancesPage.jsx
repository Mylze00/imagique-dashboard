import React, { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 🔹 Hook simple de notification
const useNotification = () => {
  const [notification, setNotification] = useState(null);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);
  const showNotification = (message, type = "info") => setNotification({ message, type });
  return { notification, showNotification };
};

// 🔹 Styles header/lignes + helpers d'affichage
const headerCls = "flex flex-col sm:flex-row font-semibold border-b pb-1 text-sm sm:text-base text-center sm:text-left";
const rowCls = "flex flex-col sm:flex-row items-center sm:items-start text-sm sm:text-base";
const cellNum = "flex-1 text-center sm:text-right";
const cellAct = "w-20 flex justify-center gap-1";

const formatAmount = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? "0" : n.toLocaleString();
};

const formatDate = (date) => {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : date;
  return d instanceof Date ? d.toLocaleString() : "";
};

const TAUX_CDF = 2800; // Taux USD -> CDF par défaut

export default function FinancesPage() {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const { notification, showNotification } = useNotification();

  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editTxId, setEditTxId] = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);

  // 🔹 Formulaires
  const [txForm, setTxForm] = useState({
    type: "Entrée",
    categorie: "",
    montant: "",
    devise: "USD",
    semaine: "S1",
    compte: "Caisse",
  });
  const [taskForm, setTaskForm] = useState({ titre: "", montant: "" });

  // 🔹 Soldes par compte
  const [soldeCaisse, setSoldeCaisse] = useState({ USD: 0, CDF: 0 });
  const [soldeBanque, setSoldeBanque] = useState({ USD: 0, CDF: 0 });

  // 🔹 Taux du jour dynamique
  const [taux, setTaux] = useState(TAUX_CDF);

  const soldeRef = useRef({ USD: 0, CDF: 0 });

  const getDisplayName = useCallback((email) => {
    if (!email) return "Utilisateur Inconnu";
    return email.split("@")[0].replace(/[._]/g, " ");
  }, []);

  // 🔹 Récupération taux USD → CDF depuis exchangerate.host
  useEffect(() => {
    const fetchTaux = async () => {
      try {
        const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=CDF");
        const data = await res.json();
        if (data?.rates?.CDF) setTaux(data.rates.CDF);
      } catch (error) {
        console.error("Erreur récupération taux :", error);
      }
    };
    fetchTaux();
  }, []);

  // 🔹 Firestore temps réel
  useEffect(() => {
    if (!currentUser || !db) return;
    const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

    const txRef = collection(db, `artifacts/${appId}/transactions`);
    const tasksRef = collection(db, `artifacts/${appId}/tasks`);

    const unsubTx = onSnapshot(
      query(txRef, orderBy("createdAt", "desc")),
      (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => showNotification("Erreur transactions: " + err.message, "error")
    );

    const unsubTasks = onSnapshot(
      query(tasksRef, orderBy("createdAt", "asc")),
      (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => showNotification("Erreur tâches: " + err.message, "error")
    );

    return () => {
      unsubTx();
      unsubTasks();
    };
  }, [currentUser, showNotification]);

  // 🔹 Calcul soldes par compte
  useEffect(() => {
    const caisse = { USD: 0, CDF: 0 };
    const banque = { USD: 0, CDF: 0 };

    transactions.forEach(t => {
      const m = parseFloat(t.montant);
      if (isNaN(m)) return;
      const cible = (t.compte === "Banque") ? banque : caisse;
      const sens = t.type === "Entrée" ? 1 : -1;
      if (t.devise === "USD") cible.USD += sens * m;
      else if (t.devise === "CDF") cible.CDF += sens * m;
    });

    setSoldeCaisse(caisse);
    setSoldeBanque(banque);

    soldeRef.current = {
      USD: caisse.USD + banque.USD,
      CDF: caisse.CDF + banque.CDF,
    };
  }, [transactions]);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  if (role !== "admin")
    return <div className="text-center text-red-600 font-bold text-xl mt-20">❌ Accès réservé aux administrateurs.</div>;

  // 🔹 Handlers transaction
  const handleTxChange = (e) => setTxForm({ ...txForm, [e.target.name]: e.target.value });
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    try {
      const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
      const txRef = collection(db, `artifacts/${appId}/transactions`);
      const payload = { ...txForm, createdAt: serverTimestamp(), adminEmail: currentUser?.email || null };

      if (editTxId) {
        await updateDoc(doc(txRef, editTxId), payload);
        setEditTxId(null);
        showNotification("Transaction mise à jour ✅", "success");
      } else {
        await addDoc(txRef, payload);
        showNotification("Transaction ajoutée ✅", "success");
      }

      setTxForm({ type: "Entrée", categorie: "", montant: "", devise: "USD", semaine: "S1", compte: "Caisse" });
    } catch (err) {
      showNotification("Erreur ajout/mise à jour: " + err.message, "error");
    }
  };
  const handleTxEdit = (tx) => setTxForm({ type: tx.type, categorie: tx.categorie, montant: tx.montant, devise: tx.devise, semaine: tx.semaine || "S1", compte: tx.compte || "Caisse" }) || setEditTxId(tx.id);
  const handleTxDelete = async (id) => {
    const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
    try { await deleteDoc(doc(db, `artifacts/${appId}/transactions`, id)); showNotification("Transaction supprimée ✅", "success"); }
    catch (err) { showNotification("Erreur suppression: " + err.message, "error"); }
  };

  // 🔹 Handlers tâches
  const handleTaskChange = (e) => setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
      const tasksRef = collection(db, `artifacts/${appId}/tasks`);
      const payload = { ...taskForm, createdAt: serverTimestamp() };

      if (editTaskId) {
        await updateDoc(doc(tasksRef, editTaskId), payload);
        setEditTaskId(null);
        showNotification("Tâche mise à jour ✅", "success");
      } else {
        await addDoc(tasksRef, payload);
        showNotification("Tâche ajoutée ✅", "success");
      }
      setTaskForm({ titre: "", montant: "" });
    } catch (err) {
      showNotification("Erreur ajout/mise à jour: " + err.message, "error");
    }
  };
  const handleTaskDelete = async (id) => {
    const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
    try { await deleteDoc(doc(db, `artifacts/${appId}/tasks`, id)); showNotification("Tâche supprimée ✅", "success"); }
    catch (err) { showNotification("Erreur suppression: " + err.message, "error"); }
  };

  const totalUSD = soldeCaisse.USD + soldeBanque.USD + (soldeCaisse.CDF + soldeBanque.CDF) / (taux || 1);
  const totalCDF = soldeCaisse.CDF + soldeBanque.CDF + (soldeCaisse.USD + soldeBanque.USD) * (taux || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded shadow text-white ${notification.type === "error" ? "bg-red-600" : notification.type === "success" ? "bg-green-600" : "bg-blue-500"}`}>
          {notification.message}
        </div>
      )}

      {/* Bandeau */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-b-xl mb-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
          <div>
            <h1 className="text-3xl font-bold">Salut {getDisplayName(currentUser.email)}!</h1>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <div className="bg-white/10 rounded p-3">
                <div className="font-semibold">Caisse</div>
                <div>USD : {soldeCaisse.USD.toFixed(2)}</div>
                <div>CDF : {soldeCaisse.CDF.toLocaleString()}</div>
              </div>
              <div className="bg-white/10 rounded p-3">
                <div className="font-semibold">Banque</div>
                <div>USD : {soldeBanque.USD.toFixed(2)}</div>
                <div>CDF : {soldeBanque.CDF.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-3 text-sm opacity-90">
              <div>Total ~ USD : {totalUSD.toFixed(2)} | CDF : {totalCDF.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <label className="text-sm">
              Taux du jour (USD → CDF)
              <input type="number" className="ml-2 px-2 py-1 rounded text-black" value={taux} onChange={(e) => setTaux(Number(e.target.value) || 0)} min={0}/>
            </label>

            <button onClick={() => navigate("/dashboard")} className="mt-1 bg-white text-blue-700 px-3 py-2 rounded shadow hover:bg-blue-50 mx-auto sm:mx-0">
              ← Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire transaction */}
      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="text-xl font-bold mb-2">{editTxId ? "Éditer Transaction" : "Nouvelle Transaction"}</h2>
        <form onSubmit={handleTxSubmit} className="grid sm:grid-cols-3 gap-2">
          <select name="type" value={txForm.type} onChange={handleTxChange} className="border p-2 rounded">
            <option>Entrée</option>
            <option>Sortie</option>
          </select>

          <input name="categorie" placeholder="Catégorie" value={txForm.categorie} onChange={handleTxChange} className="border p-2 rounded" />
          <input name="montant" type="number" placeholder="Montant" value={txForm.montant} onChange={handleTxChange} className="border p-2 rounded" />
          <select name="devise" value={txForm.devise} onChange={handleTxChange} className="border p-2 rounded">
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </select>
          <select name="semaine" value={txForm.semaine} onChange={handleTxChange} className="border p-2 rounded">
            <option value="S1">S1</option>
            <option value="S2">S2</option>
            <option value="S3">S3</option>
            <option value="S4">S4</option>
          </select>
          <select name="compte" value={txForm.compte} onChange={handleTxChange} className="border p-2 rounded">
            <option value="Caisse">Caisse</option>
            <option value="Banque">Banque</option>
          </select>
          <div className="sm:col-span-3">
            <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700" type="submit">{editTxId ? "Mettre à jour" : "Ajouter"}</button>
          </div>
        </form>
      </div>

      {/* Liste transactions */}
      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="text-xl font-bold mb-2">Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 italic">Aucune transaction trouvée</p>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            <li className={headerCls} role="row">
              <span role="columnheader" className="flex-1">Catégorie</span>
              <span className={cellNum} role="columnheader">Montant</span>
              <span className={cellNum} role="columnheader">Date</span>
              <span className="w-20 text-center" role="columnheader">Actions</span>
            </li>

            {transactions.map((t) => (
              <li key={t.id} className={`${rowCls} border-b pb-1 ${t.type === "Entrée" ? "bg-green-50" : "bg-red-50"}`} role="row">
                <div className="flex-1 flex flex-col">
                  <span className="font-medium text-gray-900">{t.categorie || "Sans catégorie"} {t.type ? `(${t.type})` : ""} – {t.compte || "Caisse"}</span>
                  <small className="text-gray-500">{t.adminEmail || "Inconnu"}</small>
                </div>
                <span className={`${cellNum} font-medium`}>{formatAmount(t.montant)} {t.devise || ""}</span>
                <span className={`${cellNum} text-gray-600`}>{formatDate(t.createdAt)}</span>
                <span className={cellAct}>
                  <button onClick={() => handleTxEdit?.(t)} className="text-yellow-600 hover:text-yellow-800" aria-label="Éditer">✏️</button>
                  <button onClick={() => handleTxDelete?.(t.id)} className="text-red-600 hover:text-red-800" aria-label="Supprimer">🗑️</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Formulaire tâche */}
      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="text-xl font-bold mb-2">{editTaskId ? "Éditer Tâche" : "Nouvelle Tâche"}</h2>
        <form onSubmit={handleTaskSubmit} className="flex flex-col gap-2">
          <input name="titre" placeholder="Titre" value={taskForm.titre} onChange={handleTaskChange} className="border p-2 rounded" />
          <input name="montant" type="number" placeholder="Montant" value={taskForm.montant} onChange={handleTaskChange} className="border p-2 rounded" />
          <button className="bg-green-600 text-white p-2 rounded hover:bg-green-700" type="submit">{editTaskId ? "Mettre à jour" : "Ajouter"}</button>
        </form>
      </div>

      {/* Liste tâches */}
      <div className="bg-white p-4 shadow rounded mb-4">
        <h2 className="text-xl font-bold mb-2">Tâches en attente</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500 italic">Aucune tâche en attente</p>
        ) : (
          <ul>
            {tasks.map(t => (
              <li key={t.id} className="flex justify-between border-b py-1">
                <span>{t.titre} - {t.montant}$</span>
                <span className="flex gap-2">
                  <button onClick={() => { setEditTaskId(t.id); setTaskForm({ titre: t.titre, montant: t.montant }); }} className="text-yellow-600 hover:text-yellow-800">✏️</button>
                  <button onClick={() => handleTaskDelete(t.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
