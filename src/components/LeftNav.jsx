import "./LeftNav.css";

const LeftNav = ({ isOpen, onClose, currentView, onViewChange }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="left-nav-overlay" onClick={onClose} />}

      {/* Sidebar */}
      <div className={`left-nav ${isOpen ? "open" : ""}`}>
        <div className="left-nav-content">
          <button
            className={`nav-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => {
              onViewChange("dashboard");
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="14"
                y="14"
                width="7"
                height="7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${currentView === "inventory" ? "active" : ""}`}
            onClick={() => {
              onViewChange("inventory");
              onClose();
            }}
          >
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
            <span>Inventory</span>
          </button>
          <button
            className={`nav-item ${currentView === "sales" ? "active" : ""}`}
            onClick={() => {
              onViewChange("sales");
              onClose();
            }}
          >
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
            <span>Sales</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default LeftNav;
