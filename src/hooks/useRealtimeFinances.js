// src/hooks/useRealtimeFinances.js
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export const useRealtimeFinances = () => {
  const { currentUser, loading, db } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading || !currentUser || !db) return;

    const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
    const transactionsQuery = query(collection(db, `artifacts/${appId}/transactions`), orderBy("createdAt", "desc"));
    const tasksQuery = query(collection(db, `artifacts/${appId}/tasks`), orderBy("createdAt", "asc"));

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingData(false);
    });

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingData(false);
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeTasks();
    };
  }, [loading, currentUser, db]);

  return { transactions, tasks, loadingData };
};
