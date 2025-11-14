const express = require("express");
const crypto = require("crypto");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json({ limit: "5mb" }));

// Environment variables (set in Heroku Config Vars)
const SFMC_URL = process.env.SFMC_URL;
const SECRET_KEY = process.env.SECRET_KEY;

app.get("/", (req, res) => {
  res.send("✅ Data Cloud → SFMC Webhook Listener is running successfully.");
});

app.post("/datacloud", async (req, res) => {
  try {
    const payload = JSON.stringify(req.body);

    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(payload)
      .digest("base64");

    console.log("Received payload:", payload);
    console.log("Generated signature:", signature);

    const response = await fetch(SFMC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
      },
      body: payload,
    });

    const responseText = await response.text();
    console.log("Response from SFMC:", responseText);

    res.status(200).json({ message: "Payload forwarded to SFMC", status: "success" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
