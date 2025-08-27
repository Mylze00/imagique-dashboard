import React from "react";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";

const testOrder = {
  id: "abc123",
  client: "John Doe",
  invoiceNumber: "INV-2025-001",
  createdAt: "2025-08-01",
  estimatedDelivery: "2025-08-10",
  total: 350,
  produits: [
    {
      designation: "Headphones",
      quantite: 2,
      prix: 50,
      total: 100,
      image: "/images/casque.jpg",
    },
    {
      designation: "Watch",
      quantite: 1,
      prix: 150,
      total: 150,
      image: "/images/montre.jpg",
    },
    {
      designation: "Laptop",
      quantite: 1,
      prix: 100,
      total: 100,
      image: "/images/laptop.jpg",
    },
  ],
};

const InvoiceTestPage = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Test PDFMake Invoice</h2>
      <button
        onClick={() => generateInvoicePDF(testOrder)}
        style={{
          backgroundColor: "#4CAF50",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Generate Invoice PDF
      </button>
    </div>
  );
};

export default InvoiceTestPage;
