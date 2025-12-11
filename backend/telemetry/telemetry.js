const express = require('express');
const router = express.Router();

// Example: GET /telemetry/latest
router.get('/latest', (req, res) => {
    // TODO: return latest telemetry
    res.json({ altitude: 1000, heading: 90 });
});

module.exports = router;