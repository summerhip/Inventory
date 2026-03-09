const NewItemDialog = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onInputChange,
  editingId,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{editingId ? "Edit Item" : "Add New Item"}</h2>
          <button onClick={onClose} className="dialog-close" title="Close">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="dialog-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                placeholder="Item name"
                value={formData.name}
                onChange={onInputChange}
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
                onChange={onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                placeholder="Stock quantity"
                value={formData.stock}
                onChange={onInputChange}
                min="0"
                required
              />
            </div>
          </div>
          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewItemDialog;
