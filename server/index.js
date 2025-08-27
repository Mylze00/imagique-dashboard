const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// ✅ Route pour envoyer un PDF par email
app.post("/send-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const recipients = JSON.parse(req.body.recipients);
    const filePath = req.file.path;

    // Transporter Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Alibaba Congo" <${process.env.EMAIL_USER}>`,
      to: recipients.join(","),
      subject: "Commande Produits - PDF",
      text: "Veuillez trouver ci-joint le PDF des produits commandés.",
      attachments: [
        {
          filename: req.file.originalname,
          path: filePath,
        },
      ],
    });

    console.log("📧 Email envoyé:", info.messageId);

    // Supprimer le fichier temporaire
    fs.unlinkSync(filePath);

    res.json({ success: true, message: "Email envoyé avec succès" });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    res.status(500).json({ success: false, message: "Erreur envoi email" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Serveur email lancé sur le port ${PORT}`));
