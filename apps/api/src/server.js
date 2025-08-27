require("dotenv").config(); 
const app = require("./app");
const pool = require("./db/pool");

const PORT = process.env.PORT || 8080;

(async () => {
  try {
    // Probar conexión DB al arrancar
    await pool.query("SELECT 1");
    console.log("DB ready");
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
})();
