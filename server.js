// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
const path = require("path");
app.use(express.static(path.join(__dirname)));

// Initialize Database
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      total_stock INTEGER,
      sold INTEGER DEFAULT 0
    )
  `);

  // Seed data (only if empty)
  db.all("SELECT COUNT(*) AS count FROM inventory", (err, rows) => {
    if (rows[0].count === 0) {
      const items = [
        ["Linen Blazer", 1300, 20],
        ["Skinny Jeans", 750, 30],
        ["Crop Top", 300, 25],
        ["Ripped Knit Top", 500, 15],
      ];
      const stmt = db.prepare("INSERT INTO inventory (name, price, total_stock) VALUES (?, ?, ?)");
      items.forEach((i) => stmt.run(i));
      stmt.finalize();
    }
  });
});

// Fetch inventory
app.get("/api/inventory", (req, res) => {
  db.all("SELECT * FROM inventory", (err, rows) => {
    res.json(rows);
  });
});

// Update sales
app.post("/api/sell", (req, res) => {
  const { id, quantity } = req.body;
  db.run(
    "UPDATE inventory SET sold = sold + ? WHERE id = ?",
    [quantity, id],
    (err) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ message: "Sale recorded successfully!" });
    }
  );
});

// Total revenue endpoint
app.get("/api/summary", (req, res) => {
  db.all("SELECT SUM(sold * price) AS revenue FROM inventory", (err, rows) => {
    res.json({ totalRevenue: rows[0].revenue || 0 });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
