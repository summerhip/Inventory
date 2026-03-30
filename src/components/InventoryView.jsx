import { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./InventoryView.css";
import NewItemDialog from "./NewItemDialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const InventoryView = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    partNumber: "",
    description: "",
    stock: "",
    price: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    clickedItem: null,
  });
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const gridRef = useRef(null);
  const overflowMenuRef = useRef(null);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible]);

  // Close overflow menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        overflowMenuOpen &&
        overflowMenuRef.current &&
        !overflowMenuRef.current.contains(event.target)
      ) {
        setOverflowMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [overflowMenuOpen]);

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
      if (editingId) {
        // Update existing item
        const response = await fetch(`${API_URL}/items/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            partNumber: formData.partNumber,
            description: formData.description,
            quantity: Number(formData.stock),
            price: formData.price !== "" ? Number(formData.price) : 0,
          }),
        });

        if (!response.ok) throw new Error("Failed to update item");

        const updatedItem = await response.json();
        setItems(
          items.map((item) => (item.id === editingId ? updatedItem : item)),
        );
      } else {
        // Add new item
        const response = await fetch(`${API_URL}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            partNumber: formData.partNumber,
            description: formData.description,
            quantity: Number(formData.stock),
            price: formData.price !== "" ? Number(formData.price) : 0,
          }),
        });

        if (!response.ok) throw new Error("Failed to create item");

        const newItem = await response.json();
        setItems([newItem, ...items]);
      }

      // Reset form and clear selection
      setFormData({
        name: "",
        partNumber: "",
        description: "",
        stock: "",
        price: "",
      });
      setEditingId(null);
      setIsDialogOpen(false);
      setSelectedRows([]);

      // Clear selection in grid
      if (gridRef.current) {
        gridRef.current.api.deselectAll();
      }
    } catch (err) {
      console.error("Error saving item:", err);
      setError("Failed to save item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSelected = () => {
    if (selectedRows.length === 1) {
      handleEditItem(selectedRows[0]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    await handleDeleteItems(selectedRows);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      partNumber: "",
      description: "",
      stock: "",
      price: "",
    });
    setIsDialogOpen(false);
  };

  const handleDialogSubmit = (e) => {
    handleSubmit(e);
  };

  const onSelectionChanged = () => {
    if (gridRef.current) {
      const selected = gridRef.current.api.getSelectedRows();
      setSelectedRows(selected);
    }
  };

  const handleEditItem = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      partNumber: item.partNumber || "",
      description: item.description || "",
      stock: item.quantity.toString(),
      price: item.price != null ? item.price.toString() : "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteItems = async (itemsToDelete) => {
    const count = itemsToDelete.length;
    const confirmMessage =
      count === 1
        ? "Are you sure you want to delete this item?"
        : `Are you sure you want to delete ${count} items?`;

    if (!confirm(confirmMessage)) return;

    setLoading(true);
    setError(null);

    try {
      // Delete all items
      await Promise.all(
        itemsToDelete.map((item) =>
          fetch(`${API_URL}/items/${item.id}`, {
            method: "DELETE",
          }),
        ),
      );

      // Remove deleted items from state
      const deletedIds = itemsToDelete.map((item) => item.id);
      setItems(items.filter((item) => !deletedIds.includes(item.id)));
      setSelectedRows([]);

      // Clear selection in grid
      if (gridRef.current) {
        gridRef.current.api.deselectAll();
      }
    } catch (err) {
      console.error("Error deleting items:", err);
      setError("Failed to delete items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellContextMenu = (event) => {
    event.event.preventDefault();
    const clickedItem = event.data;
    setContextMenu({
      visible: true,
      x: event.event.clientX,
      y: event.event.clientY,
      clickedItem,
    });
  };

  const handleContextMenuEdit = () => {
    const clickedItem = contextMenu.clickedItem;
    const isClickedItemSelected = selectedRows.some(
      (item) => item.id === clickedItem.id,
    );
    const itemsToAct = isClickedItemSelected ? selectedRows : [clickedItem];

    if (itemsToAct.length === 1) {
      handleEditItem(itemsToAct[0]);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleContextMenuDelete = () => {
    const clickedItem = contextMenu.clickedItem;
    const isClickedItemSelected = selectedRows.some(
      (item) => item.id === clickedItem.id,
    );
    const itemsToAct = isClickedItemSelected ? selectedRows : [clickedItem];

    handleDeleteItems(itemsToAct);
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Column definitions for ag-grid
  const columnDefs = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
      checkboxSelection: true,
      headerCheckboxSelection: true,
    },
    {
      field: "partNumber",
      headerName: "Part #",
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params.value || "-",
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      minWidth: 200,
      valueFormatter: (params) => params.value || "-",
    },
    {
      field: "quantity",
      headerName: "Stock",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "price",
      headerName: "Price",
      flex: 1,
      minWidth: 100,
      valueFormatter: (params) =>
        params.value != null ? `$${Number(params.value).toFixed(2)}` : "-",
    },
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  return (
    <div className="inventory-view">
      <div className="container">
        {error && <div className="error-message">{error}</div>}
        <div className="inventory-table-container">
          <div className="table-header">
            <div>
              <h2>Inventory Items</h2>
              <span className="table-count">
                {items.length} {items.length === 1 ? "item" : "items"}
                {selectedRows.length > 0 &&
                  ` (${selectedRows.length} selected)`}
              </span>
            </div>
            <div className="toolbar-actions">
              <div className="toolbar-actions-desktop">
                <button
                  onClick={handleEditSelected}
                  className="icon-btn btn-edit-icon"
                  title="Edit Selected"
                  disabled={selectedRows.length !== 1}
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
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="icon-btn btn-delete-icon"
                  title="Delete Selected"
                  disabled={selectedRows.length === 0}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Delete</span>
                </button>
                <button
                  onClick={fetchItems}
                  className="icon-btn btn-refresh-icon"
                  title="Refresh"
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="icon-btn btn-add-icon"
                  title="Add Item"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Add</span>
                </button>
              </div>
              <div className="toolbar-actions-mobile" ref={overflowMenuRef}>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="icon-btn btn-add-icon"
                  title="Add Item"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
                  className="icon-btn btn-overflow"
                  title="More Actions"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5" r="1" fill="currentColor" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                    <circle cx="12" cy="19" r="1" fill="currentColor" />
                  </svg>
                </button>
                {overflowMenuOpen && (
                  <div className="overflow-menu">
                    <button
                      onClick={() => {
                        handleEditSelected();
                        setOverflowMenuOpen(false);
                      }}
                      className="overflow-menu-item"
                      disabled={selectedRows.length !== 1}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteSelected();
                        setOverflowMenuOpen(false);
                      }}
                      className="overflow-menu-item overflow-menu-delete"
                      disabled={selectedRows.length === 0}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => {
                        fetchItems();
                        setOverflowMenuOpen(false);
                      }}
                      className="overflow-menu-item"
                      disabled={loading}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {loading && items.length === 0 ? (
            <p className="empty-message">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="empty-message">
              No items in inventory. Add your first item above!
            </p>
          ) : (
            <div
              className="ag-theme-alpine"
              style={{
                height: "500px",
                width: "100%",
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <AgGridReact
                ref={gridRef}
                rowData={items}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                onSelectionChanged={onSelectionChanged}
                onCellContextMenu={handleCellContextMenu}
                suppressCellFocus={true}
              />
            </div>
          )}
        </div>

        {contextMenu.visible && (
          <div
            className="custom-context-menu"
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const clickedItem = contextMenu.clickedItem;
              const isClickedItemSelected = selectedRows.some(
                (item) => item.id === clickedItem?.id,
              );
              const itemsToAct = isClickedItemSelected
                ? selectedRows
                : [clickedItem];
              const showEdit = itemsToAct.length === 1;

              return (
                <>
                  {showEdit && (
                    <div
                      className="context-menu-item"
                      onClick={handleContextMenuEdit}
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
                      <span>Edit</span>
                    </div>
                  )}
                  <div
                    className="context-menu-item context-menu-delete"
                    onClick={handleContextMenuDelete}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      {itemsToAct.length > 1
                        ? `Delete ${itemsToAct.length} items`
                        : "Delete"}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <NewItemDialog
          isOpen={isDialogOpen}
          onClose={handleCancelEdit}
          onSubmit={handleDialogSubmit}
          formData={formData}
          onInputChange={handleInputChange}
          editingId={editingId}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default InventoryView;
