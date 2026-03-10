import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, "inventory.db"));

// Create items table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    partNumber TEXT,
    description TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create sold_items table for out of stock/sold items
db.exec(`
  CREATE TABLE IF NOT EXISTS sold_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_item_id INTEGER,
    name TEXT NOT NULL,
    partNumber TEXT,
    description TEXT,
    category TEXT,
    quantity_sold INTEGER NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add new columns if they don't exist (for migration)
const tableInfo = db.prepare("PRAGMA table_info(items)").all();
const columnNames = tableInfo.map((col) => col.name);

if (!columnNames.includes("partNumber")) {
  try {
    db.exec(`ALTER TABLE items ADD COLUMN partNumber TEXT`);
    console.log("Added partNumber column to database");
  } catch (e) {
    console.error("Failed to add partNumber column:", e.message);
  }
}

if (!columnNames.includes("description")) {
  try {
    db.exec(`ALTER TABLE items ADD COLUMN description TEXT`);
    console.log("Added description column to database");
  } catch (e) {
    console.error("Failed to add description column:", e.message);
  }
}

export const getAllItems = () => {
  const stmt = db.prepare("SELECT * FROM items ORDER BY created_at DESC");
  return stmt.all();
};

export const getItemById = (id) => {
  const stmt = db.prepare("SELECT * FROM items WHERE id = ?");
  return stmt.get(id);
};

export const createItem = (
  name,
  quantity,
  partNumber,
  description,
  category,
) => {
  const stmt = db.prepare(
    "INSERT INTO items (name, quantity, partNumber, description, category) VALUES (?, ?, ?, ?, ?)",
  );
  const result = stmt.run(
    name,
    quantity,
    partNumber || null,
    description || null,
    category || null,
  );
  return getItemById(result.lastInsertRowid);
};

export const updateItem = (
  id,
  name,
  quantity,
  partNumber,
  description,
  category,
) => {
  const stmt = db.prepare(
    "UPDATE items SET name = ?, quantity = ?, partNumber = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  );
  stmt.run(
    name,
    quantity,
    partNumber || null,
    description || null,
    category || null,
    id,
  );
  return getItemById(id);
};

export const deleteItem = (id) => {
  const stmt = db.prepare("DELETE FROM items WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
};

// Sold Items functions
export const sellItem = (id, quantitySold) => {
  const item = getItemById(id);
  if (!item) {
    throw new Error("Item not found");
  }

  if (item.quantity < quantitySold) {
    throw new Error("Insufficient stock");
  }

  // Record the sale
  const recordStmt = db.prepare(
    "INSERT INTO sold_items (original_item_id, name, partNumber, description, category, quantity_sold) VALUES (?, ?, ?, ?, ?, ?)",
  );
  recordStmt.run(
    id,
    item.name,
    item.partNumber || null,
    item.description || null,
    item.category || null,
    quantitySold,
  );

  // If all stock is sold, delete from items
  if (item.quantity === quantitySold) {
    deleteItem(id);
    return { soldOut: true, remainingQuantity: 0 };
  } else {
    // Otherwise, update the quantity
    const newQuantity = item.quantity - quantitySold;
    const updateStmt = db.prepare(
      "UPDATE items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    );
    updateStmt.run(newQuantity, id);
    return { soldOut: false, remainingQuantity: newQuantity };
  }
};

export const sellMultipleItems = (sales) => {
  // sales is an array of { id, quantity }
  const transaction = db.transaction((salesList) => {
    const results = [];
    for (const sale of salesList) {
      const result = sellItem(sale.id, sale.quantity);
      results.push({ id: sale.id, ...result });
    }
    return results;
  });

  return transaction(sales);
};

export const getAllSoldItems = () => {
  const stmt = db.prepare("SELECT * FROM sold_items ORDER BY sale_date DESC");
  return stmt.all();
};

export const getSoldItemsByOriginalId = (originalItemId) => {
  const stmt = db.prepare(
    "SELECT * FROM sold_items WHERE original_item_id = ? ORDER BY sale_date DESC",
  );
  return stmt.all(originalItemId);
};

export default db;
