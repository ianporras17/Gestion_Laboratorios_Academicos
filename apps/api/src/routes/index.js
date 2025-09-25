const { Router } = require("express");
const router = Router();

// Importar rutas
const labsRoutes = require('./labs');
const availabilityRoutes = require('./availability');

// ejemplo de endpoint
router.get("/hello", (req, res) => {
  res.json({ message: "hello from API" });
});

// Rutas de laboratorios
router.use('/labs', labsRoutes);

// Rutas de disponibilidad
router.use('/availability', availabilityRoutes);

module.exports = router;
