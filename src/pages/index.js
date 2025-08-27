import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs/promises"; // Utilisation de 'fs/promises' pour gérer les promesses
import path from "path"; // Ajout de 'path' pour une meilleure gestion des chemins

dotenv.config();

const app = express();

// Configuration de Multer pour gérer le stockage de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Crée le dossier 'uploads' s'il n'existe pas
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Utilise un nom de fichier unique pour éviter les conflits
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// ✅ Route pour envoyer un PDF par email
app.post("/send-pdf", upload.single("pdf"), async (req, res) => {
  let filePath = null;

  try {
    // ⚠️ Vérification essentielle : si aucun fichier n'a été uploadé
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier n'a été téléchargé." });
    }

    const recipients = JSON.parse(req.body.recipients);
    filePath = req.file.path;

    // Transporter Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // ⚠️ Attention : utilisez `true` si votre serveur SMTP utilise SSL/TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Ajout de l'option de sécurité pour un meilleur débogage
      tls: {
        rejectUnauthorized: false
      }
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

    res.json({ success: true, message: "Email envoyé avec succès" });

  } catch (error) {
    console.error("Erreur envoi email:", error);
    res.status(500).json({ success: false, message: "Erreur envoi email" });

  } finally {
    // 🗑️ Assurez-vous de toujours supprimer le fichier temporaire, même en cas d'erreur
    if (filePath) {
      try {
        await fs.unlink(filePath);
        console.log(`✅ Fichier temporaire supprimé: ${filePath}`);
      } catch (unlinkError) {
        console.error(`❌ Erreur lors de la suppression du fichier temporaire: ${unlinkError}`);
      }
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur email lancé sur le port ${PORT}`));