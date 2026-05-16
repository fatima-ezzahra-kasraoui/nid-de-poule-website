import React, { useState, useEffect } from "react";
import { getUsers, getUserStats, disableUser, enableUser, deleteUser } from "../services/api";

const Icons = {
  Total: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Active: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
  Disabled: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  Reports: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>
          <Icon />
        </div>
      </div>
      <div className="stat-number" style={{ fontSize: 28 }}>{value}</div>
      <div className="stat-label" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Users() {
  const [users, setUsers]         = useState([]);
  const [stats, setStats]         = useState({ total: 0, actifs: 0, desactives: 0 });
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([getUsers(), getUserStats()]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      user.disabled ? await enableUser(user.uid) : await disableUser(user.uid);
      loadData();
    } catch (error) {
      alert("Erreur: " + error.message);
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Supprimer définitivement ${user.email} ?\nTous ses signalements seront également supprimés.`)) {
      try {
        await deleteUser(user.uid);
        loadData();
      } catch (error) {
        alert("Erreur: " + error.message);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 13, color: "var(--gray)" }}>Chargement des utilisateurs...</span>
    </div>
  );

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>Utilisateurs mobiles</h1>
        <p style={{ fontSize: 12, color: "var(--gray)" }}>{users.length} utilisateur(s) enregistré(s)</p>
      </div>

      {/* KPIs */}
      <div className="stat-grid">
        <StatCard icon={Icons.Total}    label="Total utilisateurs"    value={stats.total}               color="var(--primary)" />
        <StatCard icon={Icons.Active}   label="Actifs"                value={stats.actifs}              color="var(--success)" />
        <StatCard icon={Icons.Disabled} label="Désactivés"            value={stats.desactives}          color="var(--danger)"  />
        <StatCard icon={Icons.Reports}  label="Signalements totaux"   value={stats.totalSignalements || 0} color="var(--info)" />
      </div>

      {/* Recherche */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray)", pointerEvents: "none" }}>
            <Icons.Search />
          </div>
          <input
            type="text"
            placeholder="Rechercher par email, nom ou UID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Nom affiché</th>
              <th>Inscription</th>
              <th>Dernière connexion</th>
              <th>Signalements</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 48, color: "var(--gray)", fontSize: 13 }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : filteredUsers.map(user => (
              <tr key={user.uid} style={{ opacity: user.disabled ? 0.6 : 1 }}>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user.email}</div>
                  <div style={{ fontSize: 11, color: "var(--gray)", fontFamily: "monospace" }}>{user.uid?.substring(0, 16)}...</div>
                </td>
                <td style={{ fontSize: 13 }}>{user.displayName || "—"}</td>
                <td style={{ fontSize: 13, color: "var(--gray)" }}>{formatDate(user.creationTimestamp)}</td>
                <td style={{ fontSize: 13, color: "var(--gray)" }}>{formatDate(user.lastSignInTimestamp)}</td>
                <td>
                  <span style={{ background: "var(--info)", color: "white", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {user.reportCount || 0}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: user.disabled ? "#fdf2f2" : "#f0faf4",
                    color: user.disabled ? "var(--danger)" : "var(--success)"
                  }}>
                    {user.disabled ? "Désactivé" : "Actif"}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className="btn btn-outline"
                      style={{ fontSize: 12, padding: "5px 12px", color: user.disabled ? "var(--success)" : "var(--warning)", borderColor: user.disabled ? "var(--success)" : "var(--warning)" }}
                    >
                      {user.disabled ? "Activer" : "Désactiver"}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="btn btn-outline"
                      style={{ fontSize: 12, padding: "5px 12px", color: "var(--danger)", borderColor: "var(--danger)", whiteSpace: "nowrap" }}
>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;