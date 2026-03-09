import "./App.css";
import TopNav from "./components/TopNav";
import InventoryView from "./components/InventoryView";

const App = () => {
  return (
    <div className="app">
      <TopNav />
      <InventoryView />
    </div>
  );
};

export default App;
