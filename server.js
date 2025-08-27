// server.js
import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.use(cors({
  origin: "https://imagiqueapi.loca.lt", // ou mettre ton domaine si déployé
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

app.post("/api/scrape-alibaba", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL manquante" });

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    const title =
      $("h1[data-spm-anchor-id]").text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      "Titre non trouvé";

    const price =
      $("span.price").first().text().trim() ||
      $("meta[property='og:price:amount']").attr("content") ||
      "Prix non trouvé";

    const images = [];
    $("img").each((_, img) => {
      const src = $(img).attr("src") || $(img).attr("data-src");
      if (src && src.includes("image")) {
        images.push(src.startsWith("http") ? src : `https:${src}`);
      }
    });

    res.json({
      title,
      price,
      image: [...new Set(images)][0] || "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur scraping" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ API Alibaba running on port ${PORT}`));
