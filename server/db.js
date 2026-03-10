import initSqlJs from "sql.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "inventory.db");

let db;

export async function initDatabase() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log("Loaded existing database from disk");
  } else {
    db = new SQL.Database();
    console.log("Created new database");
  }

  db.run(`
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

  // Add new columns if they don't exist (for migration)
  const tableInfo = db.exec("PRAGMA table_info(items)");
  const columnNames =
    tableInfo.length > 0 ? tableInfo[0].values.map((row) => row[1]) : [];

  if (!columnNames.includes("partNumber")) {
    try {
      db.run("ALTER TABLE items ADD COLUMN partNumber TEXT");
      console.log("Added partNumber column to database");
    } catch (e) {
      console.error("Failed to add partNumber column:", e.message);
    }
  }

  if (!columnNames.includes("description")) {
    try {
      db.run("ALTER TABLE items ADD COLUMN description TEXT");
      console.log("Added description column to database");
    } catch (e) {
      console.error("Failed to add description column:", e.message);
    }
  }

  saveDatabase();
  console.log("Database initialized successfully");
}

function saveDatabase() {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

export const getAllItems = () => {
  return queryAll("SELECT * FROM items ORDER BY created_at DESC");
};

export const getItemById = (id) => {
  return queryOne("SELECT * FROM items WHERE id = ?", [id]);
};

export const createItem = (
  name,
  quantity,
  partNumber,
  description,
  category,
) => {
  db.run(
    "INSERT INTO items (name, quantity, partNumber, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
    [name, quantity, partNumber || null, description || null, category || null],
  );
  saveDatabase();
  const row = db.exec("SELECT last_insert_rowid() as id");
  const newId = row[0].values[0][0];
  return getItemById(newId);
};

export const updateItem = (
  id,
  name,
  quantity,
  partNumber,
  description,
  category,
) => {
  db.run(
    "UPDATE items SET name = ?, quantity = ?, partNumber = ?, description = ?, category = ?, updated_at = datetime('now') WHERE id = ?",
    [
      name,
      quantity,
      partNumber || null,
      description || null,
      category || null,
      id,
    ],
  );
  saveDatabase();
  return getItemById(id);
};

export const deleteItem = (id) => {
  const before = db.exec("SELECT COUNT(*) FROM items WHERE id = ?", [id]);
  const count = before[0].values[0][0];
  if (count === 0) return false;
  db.run("DELETE FROM items WHERE id = ?", [id]);
  saveDatabase();
  return true;
};
