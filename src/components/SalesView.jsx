import { useState, useEffect } from "react";
import "./SalesView.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const SalesView = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityErrors, setQuantityErrors] = useState({});

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

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      // Increment quantity if already in cart
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, saleQuantity: cartItem.saleQuantity + 1 }
            : cartItem,
        ),
      );
    } else {
      // Add new item to cart
      setCart([...cart, { ...item, saleQuantity: 1 }]);
    }
  };

  const updateCartQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      setQuantityErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setQuantityErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, saleQuantity: quantity } : item,
      ),
    );
  };

  const handleQuantityInput = (id, rawValue, maxQuantity) => {
    const value = rawValue.trim();
    if (value === "") {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, saleQuantity: "" } : item,
        ),
      );
      setQuantityErrors((prev) => ({ ...prev, [id]: "Required" }));
      return;
    }
    const num = Number(value);
    if (!Number.isInteger(num)) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, saleQuantity: value } : item,
        ),
      );
      setQuantityErrors((prev) => ({ ...prev, [id]: "Whole numbers only" }));
      return;
    }
    if (num < 1) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, saleQuantity: num } : item,
        ),
      );
      setQuantityErrors((prev) => ({ ...prev, [id]: "Minimum is 1" }));
      return;
    }
    if (num > maxQuantity) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, saleQuantity: num } : item,
        ),
      );
      setQuantityErrors((prev) => ({
        ...prev,
        [id]: `Only ${maxQuantity} available`,
      }));
      return;
    }
    setQuantityErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, saleQuantity: num } : item,
      ),
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    setQuantityErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setQuantityErrors({});
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (Object.keys(quantityErrors).length > 0) {
      alert("Please fix quantity errors before completing the sale.");
      return;
    }

    // Check if any item exceeds available stock
    const invalidItems = cart.filter(
      (cartItem) => cartItem.saleQuantity > cartItem.quantity,
    );
    if (invalidItems.length > 0) {
      alert(
        `Cannot complete sale: ${invalidItems[0].name} has insufficient stock (${invalidItems[0].quantity} available)`,
      );
      return;
    }

    if (!confirm("Complete this sale?")) return;

    setLoading(true);
    setError(null);

    try {
      // Use the new checkout API
      const response = await fetch(`${API_URL}/sales/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.saleQuantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete sale");
      }

      const result = await response.json();

      // Clear cart and refresh inventory
      setCart([]);
      await fetchItems();

      // Show success message with details
      const soldOutItems = result.results.filter((r) => r.soldOut);
      if (soldOutItems.length > 0) {
        alert(
          `Sale completed! ${soldOutItems.length} item(s) sold out and moved to out of stock list.`,
        );
      } else {
        alert("Sale completed successfully!");
      }
    } catch (err) {
      console.error("Error completing sale:", err);
      setError(err.message || "Failed to complete sale. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.partNumber &&
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.saleQuantity, 0);
  const cartValue = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (Number(item.saleQuantity) || 0),
    0,
  );

  return (
    <div className="sales-view">
      <div className="container">
        {error && <div className="error-message">{error}</div>}

        <div className="sales-layout">
          {/* Inventory Items List */}
          <div className="inventory-panel">
            <div className="panel-header">
              <h2>Available Items</h2>
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m21 21-4.35-4.35"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading && items.length === 0 ? (
              <p className="empty-message">Loading items...</p>
            ) : filteredItems.length === 0 ? (
              <p className="empty-message">No items found</p>
            ) : (
              <div className="items-grid">
                {filteredItems.map((item) => (
                  <div key={item.id} className="item-card">
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      {item.partNumber && (
                        <p className="part-number">Part #: {item.partNumber}</p>
                      )}
                      {item.description && (
                        <p className="description">{item.description}</p>
                      )}
                      <p className="price">
                        {item.price
                          ? `$${Number(item.price).toFixed(2)}`
                          : "No price"}
                      </p>
                      <p className="stock">
                        <span className={item.quantity < 10 ? "low-stock" : ""}>
                          {item.quantity} in stock
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="btn-add-to-cart"
                      disabled={item.quantity === 0}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 5v14M5 12h14"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Panel */}
          <div className="cart-panel">
            <div className="panel-header">
              <h2>Current Sale</h2>
              <span className="cart-count">
                {cartTotal} {cartTotal === 1 ? "item" : "items"}
              </span>
            </div>

            {cart.length === 0 ? (
              <p className="empty-message">Cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        {item.partNumber && (
                          <p className="part-number">
                            Part #: {item.partNumber}
                          </p>
                        )}
                        <p className="available">{item.quantity} available</p>
                        {item.price ? (
                          <p className="line-total">
                            ${Number(item.price).toFixed(2)} ×{" "}
                            {Number(item.saleQuantity) || 0} ={" "}
                            <strong>
                              $
                              {(
                                (item.price || 0) *
                                (Number(item.saleQuantity) || 0)
                              ).toFixed(2)}
                            </strong>
                          </p>
                        ) : null}
                      </div>
                      <div className="cart-item-actions">
                        <div className="quantity-control">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.saleQuantity - 1)
                            }
                            className="btn-quantity"
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M5 12h14"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.saleQuantity}
                            onChange={(e) =>
                              handleQuantityInput(
                                item.id,
                                e.target.value,
                                item.quantity,
                              )
                            }
                            className={`quantity-input${quantityErrors[item.id] ? " quantity-error" : ""}`}
                          />
                          <button
                            onClick={() =>
                              updateCartQuantity(item.id, item.saleQuantity + 1)
                            }
                            className="btn-quantity"
                            disabled={item.saleQuantity >= item.quantity}
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
                        </div>
                        {quantityErrors[item.id] && (
                          <p className="quantity-error-msg">
                            {quantityErrors[item.id]}
                          </p>
                        )}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="btn-remove"
                          title="Remove"
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <path
                              d="M18 6 6 18M6 6l12 12"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-actions">
                  {cartValue > 0 && (
                    <div className="cart-total">
                      <span>Total</span>
                      <span>${cartValue.toFixed(2)}</span>
                    </div>
                  )}
                  <button
                    onClick={clearCart}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={completeSale}
                    className="btn-primary"
                    disabled={loading}
                  >
                    Complete Sale
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesView;
