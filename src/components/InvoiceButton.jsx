import React from "react";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";

const InvoiceButton = ({ order }) => {
  return (
    <button
      onClick={() => generateInvoicePDF(order)}
      style={{
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      Download Invoice PDF
    </button>
  );
};

export default InvoiceButton;
