import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3000/api";

function App() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/items`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.quantity) {
      alert("Please fill in item name and quantity");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingId !== null) {
        // Update existing item
        const response = await fetch(`${API_URL}/items/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            quantity: Number(formData.quantity),
            category: formData.category,
          }),
        });

        if (!response.ok) throw new Error("Failed to update item");

        const updatedItem = await response.json();
        setItems(
          items.map((item) => (item.id === editingId ? updatedItem : item)),
        );
        setEditingId(null);
      } else {
        // Add new item
        const response = await fetch(`${API_URL}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            quantity: Number(formData.quantity),
            category: formData.category,
          }),
        });

        if (!response.ok) throw new Error("Failed to create item");

        const newItem = await response.json();
        setItems([newItem, ...items]);
      }

      // Reset form
      setFormData({ name: "", quantity: "", category: "" });
    } catch (err) {
      console.error("Error saving item:", err);
      setError("Failed to save item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      category: item.category,
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", quantity: "", category: "" });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app">
      <header>
        <h1>📦 Inventory Tracker</h1>
        <p className="stats">
          Total Items: {items.length} | Total Quantity: {totalItems}
        </p>
      </header>

      <div className="container">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="add-form">
          <h2>{editingId !== null ? "Edit Item" : "Add New Item"}</h2>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Item name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="category"
              placeholder="Category (optional)"
              value={formData.category}
              onChange={handleInputChange}
            />
          </div>
          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Saving..."
                : editingId !== null
                  ? "Update Item"
                  : "Add Item"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="inventory-list">
          <h2>Inventory Items</h2>
          {loading && items.length === 0 ? (
            <p className="empty-message">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="empty-message">
              No items in inventory. Add your first item above!
            </p>
          ) : (
            <div className="items-grid">
              {items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-header">
                    <h3>{item.name}</h3>
                    {item.category && (
                      <span className="category">{item.category}</span>
                    )}
                  </div>
                  <div className="item-quantity">
                    Quantity: <strong>{item.quantity}</strong>
                  </div>
                  <div className="item-actions">
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
