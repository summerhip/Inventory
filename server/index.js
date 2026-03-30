import express from "express";
import cors from "cors";
import {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  sellItem,
  sellMultipleItems,
  getAllSoldItems,
  getSoldItemsByOriginalId,
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
    const { name, quantity, partNumber, description, category, price } =
      req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ error: "Name and quantity are required" });
    }

    const newItem = createItem(
      name,
      quantity,
      partNumber,
      description,
      category,
      price,
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
    const { name, quantity, partNumber, description, category, price } =
      req.body;
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
      price,
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

// Sell single item
app.post("/api/items/:id/sell", (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }

    const result = sellItem(id, quantity);
    res.json({
      message: result.soldOut
        ? "Item sold out and moved to sold items"
        : "Sale completed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error selling item:", error);
    res.status(500).json({ error: error.message || "Failed to sell item" });
  }
});

// Sell multiple items (for cart checkout)
app.post("/api/sales/checkout", (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    // Validate items format
    for (const item of items) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        return res
          .status(400)
          .json({ error: "Each item must have id and valid quantity" });
      }
    }

    const results = sellMultipleItems(
      items.map((item) => ({ id: item.id, quantity: item.quantity })),
    );
    res.json({
      message: "Sale completed successfully",
      results,
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ error: error.message || "Failed to process sale" });
  }
});

// Get all sold items (out of stock list)
app.get("/api/sold-items", (req, res) => {
  try {
    const soldItems = getAllSoldItems();
    res.json(soldItems);
  } catch (error) {
    console.error("Error fetching sold items:", error);
    res.status(500).json({ error: "Failed to fetch sold items" });
  }
});

// Get sold items by original item ID
app.get("/api/sold-items/item/:id", (req, res) => {
  try {
    const soldItems = getSoldItemsByOriginalId(req.params.id);
    res.json(soldItems);
  } catch (error) {
    console.error("Error fetching sold items:", error);
    res.status(500).json({ error: "Failed to fetch sold items" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 API available at http://localhost:${PORT}/api`);
});
