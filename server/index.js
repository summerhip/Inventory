import express from "express";
import cors from "cors";
import {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  getItemById,
} from "./db.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: [
    "https://summerhip.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// API Routes

// Get all items
app.get("/api/items", (req, res) => {
  try {
    const items = getAllItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Get single item
app.get("/api/items/:id", (req, res) => {
  try {
    const item = getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// Create new item
app.post("/api/items", (req, res) => {
  try {
    const { name, quantity, partNumber, description, category } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ error: "Name and quantity are required" });
    }

    const newItem = createItem(
      name,
      quantity,
      partNumber,
      description,
      category,
    );
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// Update item
app.put("/api/items/:id", (req, res) => {
  try {
    const { name, quantity, partNumber, description, category } = req.body;
    const { id } = req.params;

    if (!name || quantity === undefined) {
      return res.status(400).json({ error: "Name and quantity are required" });
    }

    const item = getItemById(id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updatedItem = updateItem(
      id,
      name,
      quantity,
      partNumber,
      description,
      category,
    );
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete item
app.delete("/api/items/:id", (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteItem(id);

    if (!success) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  try {
    const items = getAllItems();
    res.json({ status: "ok", itemCount: items.length });
  } catch (error) {
    console.error("Health check DB error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 API available at http://localhost:${PORT}/api`);
});
