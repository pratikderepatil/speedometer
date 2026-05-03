const express = require("express");
const router = express.Router();
const speedController = require("../controllers/speedController");

router.get("/latest", speedController.getLatestSpeed);
router.get("/history", speedController.getSpeedHistory);
router.get("/stats", speedController.getStats);
router.post("/", speedController.insertSpeed);

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;
