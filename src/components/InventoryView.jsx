import { useState, useEffect } from "react";
import "./InventoryView.css";

const API_URL = "http://localhost:3000/api";

function InventoryView() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    partNumber: "",
    description: "",
    stock: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    partNumber: "",
    description: "",
    stock: "",
  });
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

    if (!formData.name || !formData.stock) {
      alert("Please fill in item name and stock");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add new item
      const response = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          partNumber: formData.partNumber,
          description: formData.description,
          quantity: Number(formData.stock),
        }),
      });

      if (!response.ok) throw new Error("Failed to create item");

      const newItem = await response.json();
      setItems([newItem, ...items]);

      // Reset form
      setFormData({ name: "", partNumber: "", description: "", stock: "" });
    } catch (err) {
      console.error("Error saving item:", err);
      setError("Failed to save item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({
      name: item.name,
      partNumber: item.partNumber || "",
      description: item.description || "",
      stock: item.quantity.toString(),
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async (id) => {
    if (!editFormData.name || !editFormData.stock) {
      alert("Please fill in item name and stock");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          partNumber: editFormData.partNumber,
          description: editFormData.description,
          quantity: Number(editFormData.stock),
        }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      const updatedItem = await response.json();
      setItems(items.map((item) => (item.id === id ? updatedItem : item)));
      setEditingId(null);
    } catch (err) {
      console.error("Error saving item:", err);
      setError("Failed to save item. Please try again.");
    } finally {
      setLoading(false);
    }
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
    setEditFormData({ name: "", partNumber: "", description: "", stock: "" });
  };

  return (
    <div className="inventory-view">
      <div className="container">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="add-form">
          <h2>Add New Item</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
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
              <label>Part #</label>
              <input
                type="text"
                name="partNumber"
                placeholder="Part number"
                value={formData.partNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                placeholder="Stock quantity"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Add Item"}
            </button>
          </div>
        </form>

        <div className="inventory-table-container">
          <h2>Inventory Items</h2>
          {loading && items.length === 0 ? (
            <p className="empty-message">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="empty-message">
              No items in inventory. Add your first item above!
            </p>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  <th className="icon-col"></th>
                  <th>Name</th>
                  <th>Part #</th>
                  <th>Description</th>
                  <th>Stock</th>
                  <th className="icon-col"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    {editingId === item.id ? (
                      <>
                        <td className="icon-col">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="icon-btn btn-save-icon"
                            disabled={loading}
                            title="Save"
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M20 6L9 17l-5-5"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                        <td>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            className="table-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="partNumber"
                            value={editFormData.partNumber}
                            onChange={handleEditInputChange}
                            className="table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditInputChange}
                            className="table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="stock"
                            value={editFormData.stock}
                            onChange={handleEditInputChange}
                            className="table-input"
                            min="0"
                            required
                          />
                        </td>
                        <td className="icon-col">
                          <button
                            onClick={handleCancelEdit}
                            className="icon-btn btn-cancel-icon"
                            disabled={loading}
                            title="Cancel"
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M18 6L6 18M6 6l12 12"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="icon-col">
                          <button
                            onClick={() => handleEdit(item)}
                            className="icon-btn btn-edit-icon"
                            title="Edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                        <td>{item.name}</td>
                        <td>{item.partNumber || "-"}</td>
                        <td>{item.description || "-"}</td>
                        <td>{item.quantity}</td>
                        <td className="icon-col">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="icon-btn btn-delete-icon"
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryView;
