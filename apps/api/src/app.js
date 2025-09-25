const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const router = require("./routes");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*"
}));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api", router);

// manejador de errores (último)
const { errorHandler } = require("./middlewares/error");
app.use(errorHandler);

module.exports = app;