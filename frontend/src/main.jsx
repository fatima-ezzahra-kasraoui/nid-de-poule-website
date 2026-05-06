import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import Reports from "./pages/Reports";
import Stats from "./pages/Stats";
import "leaflet/dist/leaflet.css";

// ─── Styles globaux ────────────────────────────────────────────────────────
const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; color: #222; }
  .layout { display: flex; min-height: 100vh; }
  .sidebar {
    width: 220px; background: #32553b; color: white;
    display: flex; flex-direction: column; padding: 24px 0; flex-shrink: 0;
  }
  .sidebar h1 { font-size: 20px; font-weight: 700; padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.15); }
  .sidebar a {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 20px; color: rgba(255,255,255,0.8);
    text-decoration: none; font-size: 15px; transition: all 0.2s;
  }
  .sidebar a:hover, .sidebar a.active {
    background: rgba(255,255,255,0.15); color: white;
  }
  .main { flex: 1; padding: 32px; overflow-y: auto; }
  .card {
    background: white; border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07); padding: 24px;
  }
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
  .stat-number { font-size: 36px; font-weight: 700; }
  .stat-label { color: #888; font-size: 13px; margin-top: 4px; }
  .badge {
    display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;
  }
  .badge-pending   { background: #FFF3E0; color: #E65100; }
  .badge-confirmed { background: #E3F2FD; color: #1565C0; }
  .badge-fixed     { background: #E8F5E9; color: #2E7D32; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1976D2; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
  td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  tr:hover td { background: #fafafa; }
  button { cursor: pointer; border: none; border-radius: 8px; padding: 6px 14px; font-size: 13px; }
  .btn-primary   { background: #1976D2; color: white; }
  .btn-warning   { background: #FF9800; color: white; }
  .btn-success   { background: #4CAF50; color: white; }
  .btn-info      { background: #2196F3; color: white; }
  .btn-outline   { background: transparent; border: 1px solid #ccc; color: #333; }
  select, input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
  h2 { font-size: 22px; font-weight: 700; margin-bottom: 20px; }
  .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px; }
  .error { color: #e53935; padding: 12px; background: #ffebee; border-radius: 8px; }
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <BrowserRouter>
        <div className="layout">
          {/* Sidebar — remplace le header.jsp avec la navbar */}
          <nav className="sidebar">
            <h1>🚧 RoadWatch</h1>
            <NavLink to="/"        end>📊 Dashboard</NavLink>
            <NavLink to="/map">🗺️ Carte</NavLink>
            <NavLink to="/reports">📋 Signalements</NavLink>
            <NavLink to="/stats">📈 Statistiques</NavLink>
          </nav>

          {/* Zone principale — remplace chaque JSP */}
          <main className="main">
            <Routes>
              <Route path="/"        element={<Dashboard />} />
              <Route path="/map"     element={<MapPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/stats"   element={<Stats />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
