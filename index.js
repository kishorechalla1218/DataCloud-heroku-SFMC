const express = require("express");
const crypto = require("crypto");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());

const SFMC_URL = process.env.SFMC_URL;
const SIGNING_KEY = process.env.SIGNING_KEY;
const PORT = process.env.PORT || 3000;

app.post("/webhook", async (req, res) => {
  try {
    const payload = JSON.stringify(req.body);
    const incomingSignature = req.header("X-SFDC-Signature");

    const computedSignature = crypto
      .createHmac("sha256", SIGNING_KEY)
      .update(payload)
      .digest("base64");

    if (computedSignature !== incomingSignature) {
      console.log("❌ Signature verification failed!");
      return res.status(401).json({ status: "error", message: "Invalid signature" });
    }

    console.log("✅ Signature verified, forwarding to SFMC...");

    const response = await fetch(SFMC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    const sfmcResponse = await response.text();
    console.log("📩 SFMC Response:", sfmcResponse);

    res.status(200).json({ status: "success", message: "Payload verified and sent to SFMC" });
  } catch (error) {
    console.error("❗ Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Middleware running on port ${PORT}`));
