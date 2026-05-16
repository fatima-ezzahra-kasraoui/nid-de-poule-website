import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getComments, deleteComment, fetchReports } from "../services/api";

const Icons = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12,19 5,12 12,5"/>
    </svg>
  ),
  Comment: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  User: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

export default function Comments() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredComments, setFilteredComments] = useState([]);
  const limit = 20;

  useEffect(() => {
    loadReport();
    loadComments();
  }, [reportId, page]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredComments(
        comments.filter(c =>
          c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.content?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredComments(comments);
    }
  }, [searchTerm, comments]);

  const loadReport = async () => {
    try {
      const reports = await fetchReports({});
      const found = reports.find(r => r.id === reportId);
      setReport(found);
    } catch (error) {
      console.error("Erreur chargement signalement:", error);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(reportId, page, limit);
      const commentsList = data.comments || [];
      setComments(commentsList);
      setFilteredComments(commentsList);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Erreur chargement commentaires:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Supprimer définitivement ce commentaire ?")) {
      try {
        await deleteComment(reportId, commentId);
        loadComments();
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Date inconnue";
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const getCommentText = (comment) => {
    return comment.text || comment.content || "";
  };

  return (
    <div className="fade-in">

      {/* Header avec navigation */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
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
              padding: "6px 12px",
              borderRadius: 8,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--light)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <Icons.ArrowLeft /> Retour
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--dark)" }}>Commentaires</h1>
            <p style={{ fontSize: 12, color: "var(--gray)", marginTop: 2 }}>Gestion des commentaires utilisateurs</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(230, 126, 34, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.Comment />
          </div>
        </div>

        {/* Carte signalement */}
        {report && (
          <div style={{
            background: "linear-gradient(135deg, var(--secondary) 0%, var(--dark) 100%)",
            padding: "16px 20px",
            borderRadius: 16,
            marginTop: 8,
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

      {/* Statistiques et recherche */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray)" }}>Total</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{total}</span>
            <span style={{ fontSize: 13, color: "var(--gray)" }}>commentaire(s)</span>
          </div>
          <div style={{ position: "relative", width: 260 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray)" }}>
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Rechercher par email ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 36, fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      {/* Liste des commentaires */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "var(--gray)", fontSize: 13 }}>Chargement des commentaires...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--gray)" }}>
            <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Aucun commentaire</div>
            <div style={{ fontSize: 12 }}>Ce signalement n'a pas encore reçu de commentaire</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Commentaire</th>
                <th>Date</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.map((comment, idx) => (
                <tr key={comment.id || idx}>
                  <td style={{ fontSize: 12, verticalAlign: "top", width: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 32, background: "rgba(230, 126, 34, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icons.User />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{comment.userEmail || "Anonyme"}</div>
                        <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 2 }}>{comment.userId?.substring(0, 12)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, lineHeight: 1.5, wordWrap: "break-word" }}>
                    {getCommentText(comment)}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--gray)", whiteSpace: "nowrap", verticalAlign: "top" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icons.Calendar />
                      {formatDate(comment.timestamp)}
                    </div>
                  </td>
                  <td style={{ verticalAlign: "top" }}>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--danger)",
                        padding: "6px",
                        borderRadius: 6,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(231, 76, 60, 0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      title="Supprimer le commentaire"
                    >
                      <Icons.Trash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-outline"
            style={{ fontSize: 12, padding: "8px 16px" }}
          >
            ← Précédent
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page <= 2) {
                pageNum = i;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              if (pageNum < 0 || pageNum >= totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: page === pageNum ? "none" : "1px solid var(--border)",
                    background: page === pageNum ? "var(--primary)" : "white",
                    color: page === pageNum ? "white" : "var(--gray)",
                    cursor: "pointer",
                    fontSize: 13,
                    transition: "all 0.2s"
                  }}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn btn-outline"
            style={{ fontSize: 12, padding: "8px 16px" }}
          >
            Suivant →
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}