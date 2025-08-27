import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Définition des emails admin connus
        const adminEmails = [
          "congoalibaba@gmail.com",
          "plilembo@gmail.com",
          "fabricekibazola@gmail.com",
        ];

        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        let userRole = "client";

        if (adminEmails.includes(user.email)) {
          userRole = "admin"; // Priorité à la liste des admins
        } else if (docSnap.exists()) {
          userRole = docSnap.data().role || "client";
        }

        setCurrentUser(user);
        setRole(userRole);
      } else {
        setCurrentUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
