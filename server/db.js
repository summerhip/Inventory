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
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const getAllItems = () => {
  const stmt = db.prepare("SELECT * FROM items ORDER BY created_at DESC");
  return stmt.all();
};

export const getItemById = (id) => {
  const stmt = db.prepare("SELECT * FROM items WHERE id = ?");
  return stmt.get(id);
};

export const createItem = (name, quantity, category) => {
  const stmt = db.prepare(
    "INSERT INTO items (name, quantity, category) VALUES (?, ?, ?)",
  );
  const result = stmt.run(name, quantity, category || null);
  return getItemById(result.lastInsertRowid);
};

export const updateItem = (id, name, quantity, category) => {
  const stmt = db.prepare(
    "UPDATE items SET name = ?, quantity = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  );
  stmt.run(name, quantity, category || null, id);
  return getItemById(id);
};

export const deleteItem = (id) => {
  const stmt = db.prepare("DELETE FROM items WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
};

export default db;
