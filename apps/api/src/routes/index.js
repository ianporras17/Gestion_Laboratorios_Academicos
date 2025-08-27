const { Router } = require("express");
const router = Router();

// ejemplo de endpoint
router.get("/hello", (req, res) => {
  res.json({ message: "hello from API" });
});

module.exports = router;
