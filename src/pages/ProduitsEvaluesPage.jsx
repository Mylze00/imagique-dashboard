import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const PAGE_SIZE = 12;
const CACHE_KEY = "store_products_cache";

const categoriesList = [
  { key: "all", label: "Tout" },
  { key: "beauty", label: "Beauté" },
  { key: "accessoires", label: "Accessoires" },
  { key: "electronique", label: "Électronique" },
  { key: "mode", label: "Mode" },
  { key: "maison", label: "Maison" },
];

const mergeProducts = (existing, incoming) => {
  const merged = [...existing];
  incoming.forEach((prod) => {
    if (!merged.find((p) => p.code === prod.code)) merged.push(prod);
  });
  return merged;
};

const ProduitsEvaluesPage = () => {
  const [produits, setProduits] = useState([]);
  const [modeExpedition, setModeExpedition] = useState("Air");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [filterType, setFilterType] = useState("all");
  const [lastDoc, setLastDoc] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setProduits(parsed.data);
      setLastDoc(parsed.lastDoc || null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Produits évalués
    const unsubEvalués = onSnapshot(
      query(collection(db, "produitsEvalués"), orderBy("createdAt", "desc"), limit(PAGE_SIZE)),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            source: "evalué",
            prixFinal: parseFloat(data.prixCommande ?? data.total ?? data.prix ?? data.montant ?? 0)
          };
        });
        setProduits((prev) => mergeProducts(prev, list));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, lastDoc: snapshot.docs[snapshot.docs.length - 1] }));
        setLoading(false);
      }
    );

    // Produits commandés
    const unsubCommandes = onSnapshot(
      query(collection(db, "commandes"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const allProducts = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.produits) {
            data.produits.forEach((p) => {
              if (!allProducts.find((prod) => prod.code === p.code)) {
                allProducts.push({
                  ...p,
                  source: "commande",
                  prixFinal: parseFloat(p.total ?? p.prix ?? p.montant ?? 0)
                });
              }
            });
          }
        });
        setProduits((prev) => mergeProducts(prev, allProducts));
      }
    );

    return () => {
      unsubEvalués();
      unsubCommandes();
    };
  }, []);

  const fetchMoreProducts = async () => {
    if (!lastDoc) return;
    setIsFetchingMore(true);

    const q = query(
      collection(db, "produitsEvalués"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snapshot = await getDocs(q);

    const list = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        source: "evalué",
        prixFinal: parseFloat(data.prixCommande ?? data.total ?? data.prix ?? data.montant ?? 0)
      };
    });

    setProduits((prev) => [...prev, ...list]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: [...produits, ...list], lastDoc: snapshot.docs[snapshot.docs.length - 1] }));
    setIsFetchingMore(false);
  };

  const lastProductRef = useCallback(
    (node) => {
      if (loading || isFetchingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && lastDoc) {
          fetchMoreProducts();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, isFetchingMore, lastDoc]
  );

  const isNewProduct = (prod) => {
    if (!prod.createdAt?.toDate) return false;
    const productDate = prod.createdAt.toDate();
    const daysDiff = (Date.now() - productDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  let filteredProduits = produits.filter((p) => {
    const matchSearch = p.nomProduit?.toLowerCase().includes(search.toLowerCase()) || p.designation?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || p.categorie?.toLowerCase() === category.toLowerCase();
    const matchType = filterType === "all" || (filterType === "commande" && p.source === "commande") || (filterType === "evalué" && p.source === "evalué");
    return matchSearch && matchCategory && matchType;
  });

  if (sort === "prix-asc") filteredProduits.sort((a, b) => a.prixFinal - b.prixFinal);
  else if (sort === "prix-desc") filteredProduits.sort((a, b) => b.prixFinal - a.prixFinal);
  else if (sort === "quantite") filteredProduits.sort((a, b) => (b.quantite || 0) - (a.quantite || 0));

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar className="hidden sm:block" />
      <div className="flex-1 flex flex-col">
        <Header className="hidden sm:block" />
        <main className="p-2 sm:p-4">
          <button onClick={() => navigate("/dashboard")} className="sm:hidden mb-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-sm text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <input type="text" placeholder="🔍 Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-1/3 border border-gray-300 rounded-full px-4 py-2 text-sm" />
            <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-2/3">
              <select className="border border-gray-300 rounded-full px-4 py-2 text-xs" value={modeExpedition} onChange={(e) => setModeExpedition(e.target.value)}>
                <option value="Air">✈️ Aérien</option>
                <option value="Maritime">🚢 Maritime</option>
              </select>
              <select className="border border-gray-300 rounded-full px-4 py-2 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Trier par défaut</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix décroissant</option>
                <option value="quantite">Quantité disponible</option>
              </select>
              <select className="border border-gray-300 rounded-full px-4 py-2 text-xs" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Tous</option>
                <option value="commande">Produits Commandés</option>
                <option value="evalué">Produits Évalués</option>
              </select>
            </div>
          </div>

          {/* Catégories */}
          <div className="flex overflow-x-auto space-x-2 mb-4 py-2 no-scrollbar">
            {categoriesList.map((cat) => (
              <button key={cat.key} onClick={() => setCategory(cat.key)}
                className={`px-4 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-200 ${category === cat.key ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"}`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grille */}
          {loading ? (
            <p className="text-center text-gray-500">Chargement...</p>
          ) : filteredProduits.length === 0 ? (
            <p className="text-center text-gray-500">Aucun produit trouvé.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredProduits.map((prod, index) => (
                <div key={prod.id || index} ref={index === filteredProduits.length - 1 ? lastProductRef : null}
                  className={`relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-2 flex flex-col ${prod.quantite === 0 ? "opacity-60" : ""}`}>
                  <div className="relative w-full aspect-square bg-gray-100 rounded-md overflow-hidden mb-2">
                    <img src={prod.imageProduit || prod.images?.[0]} alt={prod.nomProduit || prod.designation} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xs line-clamp-2 min-h-[30px]">{prod.nomProduit || prod.designation}</h3>
                  <div className="flex-1"></div>
                  <span className="text-green-700 font-bold text-xs mt-1">💵 {prod.prixFinal.toFixed(2)} $</span>
                  <span className="text-[10px] text-gray-500 mb-2">Stock : {prod.quantite || 0}</span>
                  {prod.source === "commande" && <span className="absolute top-3 right-3 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full shadow-md font-semibold">📦 Commandé</span>}
                  <button disabled={prod.quantite === 0} className={`mt-auto px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${prod.quantite === 0 ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>Commander</button>
                  {isNewProduct(prod) && <span className="absolute top-3 left-3 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full shadow-md font-semibold">🔥 Nouveau</span>}
                </div>
              ))}
            </div>
          )}
          {isFetchingMore && <p className="text-center mt-4 text-sm text-gray-500">Chargement plus de produits...</p>}
        </main>
      </div>
    </div>
  );
};

export default ProduitsEvaluesPage;
