import { useState, useEffect } from "react";
import "./App.css";
import Login from "./components/Login";
import TopNav from "./components/TopNav";
import LeftNav from "./components/LeftNav";
import DashboardView from "./components/DashboardView";
import InventoryView from "./components/InventoryView";
import SalesView from "./components/SalesView";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [isLeftNavOpen, setIsLeftNavOpen] = useState(false);
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem("currentView") || "dashboard";
  });

  // Save current view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("currentView", currentView);
  }, [currentView]);

  const handleLogin = (username) => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("username", username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("currentView");
    setIsLeftNavOpen(false);
    setCurrentView("dashboard");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <TopNav
        onMenuClick={() => setIsLeftNavOpen(true)}
        onLogout={handleLogout}
      />
      <LeftNav
        isOpen={isLeftNavOpen}
        onClose={() => setIsLeftNavOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      {currentView === "dashboard" && <DashboardView />}
      {currentView === "inventory" && <InventoryView />}
      {currentView === "sales" && <SalesView />}
    </div>
  );
};

export default App;
