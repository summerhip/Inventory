import { useState, useEffect } from "react";
import "./DashboardView.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const DashboardView = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    uniqueParts: 0,
    totalQuantity: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivity();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/items`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();

      // Calculate statistics
      const totalItems = data.length;
      const lowStock = data.filter((item) => item.quantity < 10).length;
      const uniqueParts = new Set(
        data.map((item) => item.partNumber).filter((pn) => pn),
      ).size;
      const totalQuantity = data.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );

      setStats({
        totalItems,
        lowStock,
        uniqueParts,
        totalQuantity,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch(`${API_URL}/sold-items`);
      if (!response.ok) throw new Error("Failed to fetch activity");
      const data = await response.json();
      // Get the 10 most recent sales
      setRecentActivity(data.slice(0, 10));
    } catch (err) {
      console.error("Error fetching recent activity:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard-view">
      <div className="container">
        <h1>Dashboard</h1>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Total Items</h3>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="card-value">
              {loading ? "..." : stats.totalItems}
            </div>
            <div className="card-footer">In inventory</div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Low Stock</h3>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="12"
                  y1="9"
                  x2="12"
                  y2="13"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="12"
                  y1="17"
                  x2="12.01"
                  y2="17"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="card-value">{loading ? "..." : stats.lowStock}</div>
            <div className="card-footer">Items below 10</div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Unique Parts</h3>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="card-value">
              {loading ? "..." : stats.uniqueParts}
            </div>
            <div className="card-footer">Part numbers</div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Total Quantity</h3>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path
                  d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 6v2M12 16v2"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="card-value">
              {loading ? "..." : stats.totalQuantity.toLocaleString()}
            </div>
            <div className="card-footer">Units in stock</div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p className="empty-message">No recent activity</p>
            ) : (
              <ul className="activity-items">
                {recentActivity.map((sale) => (
                  <li key={sale.id} className="activity-item">
                    <div className="activity-icon">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle
                          cx="9"
                          cy="21"
                          r="1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="20"
                          cy="21"
                          r="1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="activity-details">
                      <div className="activity-main">
                        <span className="activity-name">{sale.name}</span>
                        {sale.partNumber && (
                          <span className="activity-part">
                            #{sale.partNumber}
                          </span>
                        )}
                      </div>
                      <div className="activity-meta">
                        <span className="activity-quantity">
                          Sold {sale.quantity_sold} unit
                          {sale.quantity_sold > 1 ? "s" : ""}
                        </span>
                        <span className="activity-time">
                          {formatDate(sale.sale_date)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
