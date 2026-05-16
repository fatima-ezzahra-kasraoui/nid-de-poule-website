import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import Reports from "./pages/Reports";
import Stats from "./pages/Stats";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Comments from "./pages/Comments";
import Likes from "./pages/Likes";
import { isAuthenticated, getUser, logout } from "./services/auth";
import "leaflet/dist/leaflet.css";
import "./styles/theme.css";


const NavIcons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Map: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2 1,6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  Reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Stats: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

function AuthenticatedApp({ onLogout }) {
  const user = getUser();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon" style={{ fontSize: 13 }}>RW</div>
            <div>
              <div className="sidebar-logo-text">ROADWATCH</div>
              <div className="sidebar-logo-sub">Gestion des infrastructures</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end><NavIcons.Dashboard /> Tableau de bord</NavLink>
          <NavLink to="/map"><NavIcons.Map /> Visualisation cartographique</NavLink>
          <NavLink to="/reports"><NavIcons.Reports /> Gestion des signalements</NavLink>
          <NavLink to="/stats"><NavIcons.Stats /> Analyses statistiques</NavLink>
          <NavLink to="/users"><NavIcons.Users /> Utilisateurs mobiles</NavLink>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div style={{ padding: "12px 16px", marginBottom: 8, borderRadius: 8, background: "rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Connecté en tant que</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 500 }}>{user.email || user.username || "Administrateur"}</div>
            </div>
          )}
          <button onClick={onLogout} className="logout-button">
            <NavIcons.Logout /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/users" element={<Users />} />
          <Route path="/comments/:reportId" element={<Comments />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/likes/:reportId" element={<Likes />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState({ isLoggedIn: false, user: null, loading: true });

  useEffect(() => {
    setAuth({ isLoggedIn: isAuthenticated(), user: getUser(), loading: false });
  }, []);

  const handleLogin = () => setAuth({ isLoggedIn: true, user: getUser(), loading: false });
  const handleLogout = () => { logout(); setAuth({ isLoggedIn: false, user: null, loading: false }); };

  if (auth.loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e9ecef", borderTop: "3px solid #e67e22", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!auth.isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <AuthenticatedApp onLogout={handleLogout} />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);