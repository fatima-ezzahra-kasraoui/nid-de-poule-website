import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReports, updateStatus, getExportUrl, deleteReport, getReportHistory, getLikes } from "../services/api";
import HistoryModal from "../components/HistoryModal";

const Icons = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Excel: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
    </svg>
  ),
  PDF: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <path d="M8 13h8M8 17h6"/>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  History: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: "En attente", color: "var(--warning)", bg: "rgba(243, 156, 18, 0.1)", dotColor: "#f39c12" },
    confirmed: { label: "Confirmé", color: "var(--info)", bg: "rgba(52, 152, 219, 0.1)", dotColor: "#3498db" },
    fixed: { label: "Réparé", color: "var(--success)", bg: "rgba(39, 174, 96, 0.1)", dotColor: "#27ae60" }
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: config.bg, borderRadius: 20, color: config.color, fontSize: 12, fontWeight: 500 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.dotColor }} />
      <span>{config.label}</span>
    </div>
  );
};

const StatusSelect = ({ currentStatus, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const options = [
    { value: "pending", label: "En attente", color: "var(--warning)" },
    { value: "confirmed", label: "Confirmer", color: "var(--info)" },
    { value: "fixed", label: "Réparé", color: "var(--success)" }
  ];
  const currentOption = options.find(opt => opt.value === currentStatus);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "white", border: `1px solid ${currentOption?.color || "var(--border)"}`, borderRadius: 20, fontSize: 12, fontWeight: 500, color: currentOption?.color, cursor: "pointer", transition: "all 0.2s" }}
      >
        <span>{currentOption?.label}</span>
        <Icons.ChevronDown />
      </button>
      {isOpen && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "white", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "1px solid var(--border)", zIndex: 10, minWidth: 120, overflow: "hidden" }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: currentStatus === opt.value ? "rgba(230, 126, 34, 0.05)" : "white", border: "none", fontSize: 12, color: opt.color, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--light)"}
              onMouseLeave={(e) => e.currentTarget.style.background = currentStatus === opt.value ? "rgba(230, 126, 34, 0.05)" : "white"}
            >
              <span>{opt.label}</span>
              {currentStatus === opt.value && <Icons.Check />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const [modalHistory, setModalHistory] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleting, setDeleting] = useState(false);

  function loadReports() {
    setLoading(true);
    const from = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const to = dateTo ? new Date(dateTo).getTime() : undefined;
    fetchReports({ status, dateFrom: from, dateTo: to })
      .then(data => { setReports(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }

  useEffect(() => { loadReports(); }, []);

  async function handleUpdateStatus(reportId, newStatus) {
    try {
      await updateStatus(reportId, newStatus);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (e) {
      alert("Erreur : " + e.message);
    }
  }

  async function handleDeleteReport() {
    if (!modalDelete) return;
    setDeleting(true);
    try {
      await deleteReport(modalDelete.id);
      setReports(prev => prev.filter(r => r.id !== modalDelete.id));
      setModalDelete(null);
    } catch (e) {
      alert("Erreur lors de la suppression : " + e.message);
    } finally {
      setDeleting(false);
    }
  }

  const handleRowClick = async (report) => {
    try {
      const likesData = await getLikes(report.id);
      setModalDetail({
        ...report,
        likeCount: likesData.likeCount || 0,
        likedBy: likesData.likedBy || []
      });
    } catch (error) {
      console.error("Erreur chargement likes:", error);
      setModalDetail({ ...report, likeCount: 0, likedBy: [] });
    }
  };

  if (error) return <p style={{ color: "var(--danger)", padding: 20 }}>{error}</p>;

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>Gestion des signalements</h1>
          <p style={{ fontSize: 12, color: "var(--gray)" }}>{reports.length} signalement(s) trouvé(s)</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={getExportUrl("excel", status)} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, textDecoration: "none", color: "var(--success)", borderColor: "var(--success)" }}>
            <Icons.Excel /> Exporter Excel
          </a>
          <a href={getExportUrl("pdf", status)} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, textDecoration: "none", color: "var(--danger)", borderColor: "var(--danger)" }}>
            <Icons.PDF /> Exporter PDF
          </a>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Filtres</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="form-input">
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmés</option>
              <option value="fixed">Réparés</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Du</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="form-input" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Au</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="form-input" />
          </div>
          <button className="btn btn-primary" onClick={loadReports} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icons.Search /> Filtrer
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: 13, color: "var(--gray)" }}>Chargement...</span>
          </div>
        ) : (
          <table className="data-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Adresse</th>
                <th>Utilisateur</th>
                <th>Détection IA</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Action</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 48, color: "var(--gray)", fontSize: 13 }}>
                    Aucun signalement trouvé
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      {r.photoUrl ? (
                        <img
                          src={r.photoUrl} alt="photo"
                          style={{ width: 56, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid var(--border)" }}
                          onClick={() => setModalPhoto(r)}
                        />
                      ) : (
                        <div style={{ width: 56, height: 44, borderRadius: 6, background: "var(--light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 18, color: "var(--gray)" }}>—</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{r.address || "Adresse non renseignée"}</div>
                      <div style={{ color: "var(--gray)", fontSize: 11 }}>{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.userEmail || "Anonyme"}</td>
                    <td style={{ textAlign: "center" }}>
                      {r.aiDetected ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--success)" }}>Détecté</div>
                          <div style={{ fontSize: 11, color: "var(--gray)" }}>{Math.round(r.aiConfidence * 100)}% confiance</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--gray)" }}>Non détecté</span>
                      )}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize: 13, color: "var(--gray)" }}>{r.formattedDate}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <StatusSelect
                        currentStatus={r.status}
                        onChange={(newStatus) => handleUpdateStatus(r.id, newStatus)}
                      />
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setModalHistory(r)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--info)", padding: "6px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Voir l'historique"
                        >
                          <Icons.History />
                        </button>
                        <button
                          onClick={() => setModalDelete(r)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--danger)", padding: "6px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Supprimer le signalement"
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal photo */}
      {modalPhoto && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setModalPhoto(null)}
        >
          <div style={{ background: "white", borderRadius: 12, overflow: "hidden", maxWidth: 520, width: "90%" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "14px 20px", fontWeight: 600, fontSize: 14, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{modalPhoto.address || "Signalement"}</span>
              <button onClick={() => setModalPhoto(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray)", display: "flex" }}>
                <Icons.Close />
              </button>
            </div>
            <img src={modalPhoto.photoUrl} alt="photo" style={{ width: "100%", maxHeight: 480, objectFit: "contain" }} />
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {modalDelete && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}
          onClick={() => !deleting && setModalDelete(null)}
        >
          <div style={{ background: "white", borderRadius: 12, padding: 24, maxWidth: 400, width: "90%" }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Confirmer la suppression</div>
              <div style={{ fontSize: 13, color: "var(--gray)" }}>Cette action est irréversible. Voulez-vous supprimer définitivement ce signalement ?</div>
              <div style={{ fontSize: 13, marginTop: 16, padding: 12, background: "var(--light)", borderRadius: 8 }}>
                <div><strong>Adresse :</strong> {modalDelete.address || "Non renseignée"}</div>
                <div><strong>Date :</strong> {modalDelete.formattedDate}</div>
                <div><strong>Utilisateur :</strong> {modalDelete.userEmail || "Anonyme"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setModalDelete(null)} className="btn btn-outline" disabled={deleting}>Annuler</button>
              <button onClick={handleDeleteReport} className="btn" style={{ background: "var(--danger)", color: "white", border: "none" }} disabled={deleting}>
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historique */}
      {modalHistory && (
        <HistoryModal report={modalHistory} onClose={() => setModalHistory(null)} />
      )}

      {/* Modal détail signalement */}
      {modalDetail && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1002, backdropFilter: "blur(4px)" }}
          onClick={() => setModalDetail(null)}
        >
          <div
            style={{ background: "white", borderRadius: 24, maxWidth: 560, width: "90%", maxHeight: "85vh", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", animation: "modalFadeIn 0.3s ease", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            <div style={{
              padding: "18px 24px",
              background: "linear-gradient(135deg, var(--secondary) 0%, var(--dark) 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.3px" }}>Détail du signalement</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, fontFamily: "monospace" }}>
                  ID: {modalDetail.id}
                </div>
              </div>
              <button
                onClick={() => setModalDetail(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: 10,
                  padding: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              >
                <Icons.Close />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {modalDetail.photoUrl && (
                <div style={{ position: "relative" }}>
                  <img
                    src={modalDetail.photoUrl}
                    alt="photo du signalement"
                    style={{ width: "100%", maxHeight: 240, objectFit: "cover" }}
                  />
                </div>
              )}

              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <StatusBadge status={modalDetail.status} />
                  <span style={{ fontSize: 12, color: "var(--gray)" }}>{modalDetail.formattedDate}</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Localisation</div>
                  <div style={{ background: "var(--light)", borderRadius: 12, padding: "12px 16px", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{modalDetail.address || "Adresse non renseignée"}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)", fontFamily: "monospace" }}>
                      {modalDetail.latitude?.toFixed(6)}, {modalDetail.longitude?.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Description</div>
                  <div style={{ background: "var(--light)", borderRadius: 12, padding: "12px 16px", border: "1px solid var(--border)", fontSize: 13, lineHeight: 1.5, color: modalDetail.description ? "var(--dark)" : "var(--gray)", fontStyle: modalDetail.description ? "normal" : "italic" }}>
                    {modalDetail.description || "Aucune description fournie"}
                  </div>
                </div>

                {/* Section COMMENTAIRES */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Commentaires</div>
                  <div style={{
                    background: "var(--light)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: 13, color: "var(--dark)" }}>
                      {modalDetail.commentCount || 0} commentaire(s)
                    </span>
                    <button
                      onClick={() => navigate(`/comments/${modalDetail.id}`)}
                      style={{
                        fontSize: 12,
                        color: "var(--primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 500
                      }}
                    >
                      Voir tous les commentaires →
                    </button>
                  </div>
                </div>

                {/* Section CONFIRMATIONS */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Confirmations</div>
                  <div style={{
                    background: "var(--light)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: 13, color: "var(--dark)" }}>
                      {modalDetail.likeCount || 0} confirmation(s)
                    </span>
                    <button
                      onClick={() => navigate(`/likes/${modalDetail.id}`)}
                      style={{
                        fontSize: 12,
                        color: "var(--primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 500
                      }}
                    >
                      Voir tous les validateurs →
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Signalé par</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{modalDetail.userEmail || "Anonyme"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Détection IA</div>
                    {modalDetail.aiDetected ? (
                      <div>
                        <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}>Détecté</span>
                        <div style={{ marginTop: 4, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${Math.round(modalDetail.aiConfidence * 100)}%`, height: "100%", background: "var(--success)" }} />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4 }}>{Math.round(modalDetail.aiConfidence * 100)}% de confiance</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--gray)" }}>Non détecté</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--border)",
              background: "#fafafa",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              flexShrink: 0
            }}>
              <button
                onClick={() => setModalDetail(null)}
                style={{
                  fontSize: 13,
                  padding: "8px 20px",
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--gray)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--light)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "white"}
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setModalDetail(null);
                  navigate(`/map?reportId=${modalDetail.id}`);
                }}
                style={{
                  fontSize: 13,
                  padding: "8px 20px",
                  background: "var(--primary)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-dark)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--primary)"}
              >
                Voir sur la carte
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}