const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");               
const fs = require("fs");
const router = require("./routes");         // ✅ usa 'router' de forma consistente

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false })); // útil si sirves /uploads
const allowed = process.env.CORS_ORIGIN?.split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed?.length ? allowed : true, credentials: true }));

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

// ✅ Rutas de API (una sola vez)
app.use("/api", router);

// ✅ Servir /uploads (y crear dir si no existe)
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// Endpoints de health adicionales (opcionales)
app.get("/ping", (_req, res) => res.json({ pong: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Manejador de errores al final
const { errorHandler } = require("./middlewares/error");
app.use(errorHandler);

module.exports = app;
