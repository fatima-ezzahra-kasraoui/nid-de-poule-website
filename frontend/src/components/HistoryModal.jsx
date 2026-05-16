import React, { useState, useEffect } from "react";
import { getReportHistory } from "../services/api";

const Icons = {
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  History: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Clock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12,5 19,12 12,19"/>
    </svg>
  ),
};

function HistoryModal({ report, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (report && report.id) {
      getReportHistory(report.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [report]);

  const getStatusLabel = (status) => {
    const labels = { pending: "En attente", confirmed: "Confirmé", fixed: "Réparé" };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "var(--warning)",
      confirmed: "var(--info)",
      fixed: "var(--success)"
    };
    return colors[status] || "var(--gray)";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Date inconnue";
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!report) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <div style={{
        background: "white",
        borderRadius: 20,
        width: "90%",
        maxWidth: 550,
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        overflow: "hidden"
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          background: "linear-gradient(135deg, var(--secondary) 0%, var(--dark) 100%)",
          color: "white"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Icons.History />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Historique du signalement</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {report.address?.substring(0, 50) || "Adresse inconnue"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 10,
              padding: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            <Icons.Close />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 0",
              gap: 12
            }}>
              <div style={{
                width: 32,
                height: 32,
                border: "3px solid var(--border)",
                borderTop: "3px solid var(--primary)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontSize: 13, color: "var(--gray)" }}>Chargement de l'historique...</span>
            </div>
          ) : history.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--gray)"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Aucune action enregistrée</div>
              <div style={{ fontSize: 12 }}>Les changements de statut apparaîtront ici</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--light)",
                    borderRadius: 12,
                    padding: "16px",
                    borderLeft: `4px solid ${getStatusColor(item.newValue)}`,
                    transition: "transform 0.2s",
                  }}
                >
                  {/* Date */}
                  <div style={{
                    fontSize: 11,
                    color: "var(--gray)",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <Icons.Clock />
                    <span>{formatDate(item.timestamp)}</span>
                  </div>

                  {/* Utilisateur */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 12
                  }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: 28,
                      background: "rgba(230, 126, 34, 0.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Icons.User />
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)" }}>
                      {item.userEmail || "Administrateur"}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--gray)" }}>a modifié le statut</span>
                  </div>

                  {/* Changement de statut */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginLeft: 36
                  }}>
                    <span style={{
                      background: "white",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      color: getStatusColor(item.oldValue),
                      border: `1px solid ${getStatusColor(item.oldValue)}`
                    }}>
                      {getStatusLabel(item.oldValue)}
                    </span>
                    <Icons.ArrowRight />
                    <span style={{
                      background: `rgba(${item.newValue === "fixed" ? "39, 174, 96" : item.newValue === "confirmed" ? "52, 152, 219" : "243, 156, 18"}, 0.1)`,
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      color: getStatusColor(item.newValue)
                    }}>
                      {getStatusLabel(item.newValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px",
          borderTop: "1px solid var(--border)",
          background: "#fafafa",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--gray)"
        }}>
          <span>Total : {history.length} action(s)</span>
          <span>RoadWatch • Traçabilité</span>
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;