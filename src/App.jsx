import { useState, useEffect } from "react";
import "./App.css";
import Login from "./components/Login";
import TopNav from "./components/TopNav";
import LeftNav from "./components/LeftNav";
import DashboardView from "./components/DashboardView";
import InventoryView from "./components/InventoryView";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const [isLeftNavOpen, setIsLeftNavOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

  const handleLogin = (username) => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("username", username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
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
    </div>
  );
};

export default App;
