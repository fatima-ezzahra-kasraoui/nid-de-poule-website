import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLikesPaginated, getReportById } from "../services/api";

const Icons = {
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12,19 5,12 12,5"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Like: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
};

export default function Likes() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadReport();
    loadLikes();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const data = await getReportById(reportId);
      setReport(data);
    } catch (error) {
      console.error("Erreur chargement signalement:", error);
    }
  };

  const loadLikes = async () => {
    setLoading(true);
    try {
      const data = await getLikesPaginated(reportId, 0, 100);
      setLikes(data.likes || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Erreur chargement likes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate("/reports")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            padding: "8px 0",
            marginBottom: 16
          }}
        >
          <Icons.ArrowLeft /> Retour aux signalements
        </button>

        {report && (
          <div style={{
            background: "linear-gradient(135deg, var(--secondary) 0%, var(--dark) 100%)",
            padding: "16px 20px",
            borderRadius: 12,
            color: "white"
          }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Signalement concerné</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{report.address || "Adresse non renseignée"}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
              {report.formattedDate} • {report.userEmail || "Anonyme"}
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="card" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <Icons.Like />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray)" }}>Total des confirmations</span>
        <span style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{total}</span>
      </div>

      {/* Liste des validateurs */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "var(--gray)", fontSize: 13 }}>Chargement...</span>
          </div>
        ) : likes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--gray)" }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>👍</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Aucune confirmation</div>
            <div style={{ fontSize: 12 }}>Ce signalement n'a pas encore été confirmé</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>ID utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {likes.map((like, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 32, background: "rgba(230, 126, 34, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
                        {like.displayName ? like.displayName[0].toUpperCase() : <Icons.User />}
                      </div>
                      <span>{like.displayName || like.userId?.substring(0, 12) || "—"}</span>
                    </div>
                   </td>
                  <td style={{ fontSize: 13 }}>{like.userEmail || "—"} </td>
                  <td style={{ fontSize: 11, color: "var(--gray)", fontFamily: "monospace" }}>
                    {like.userId || "—"}
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}