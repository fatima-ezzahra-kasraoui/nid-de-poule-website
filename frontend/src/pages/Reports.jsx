import { useEffect, useState } from "react";
import { fetchReports, updateStatus, getExportUrl } from "../services/api";

/**
 * Remplace reports.jsp
 * Ancien : formulaire HTML GET → ReportsServlet → req.setAttribute() → JSP avec JSTL forEach
 * Nouveau : state React pour les filtres → fetch API → tableau React
 */
export default function Reports() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modalPhoto, setModalPhoto] = useState(null);

  // Filtres (état local — identique aux paramètres du formulaire JSP)
  const [status,   setStatus]   = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  function loadReports() {
    setLoading(true);
    const from = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const to   = dateTo   ? new Date(dateTo).getTime()   : undefined;

    fetchReports({ status, dateFrom: from, dateTo: to })
      .then(data => { setReports(data); setLoading(false); })
      .catch(e   => { setError(e.message); setLoading(false); });
  }

  useEffect(() => { loadReports(); }, []);

  async function handleUpdateStatus(reportId, newStatus) {
    try {
      await updateStatus(reportId, newStatus);
      // Mise à jour locale sans rechargement — identique au AJAX de l'ancien reports.jsp
      setReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
      );
    } catch (e) {
      alert("Erreur : " + e.message);
    }
  }

  const STATUS_BADGE = {
    pending:   <span className="badge badge-pending">En attente</span>,
    confirmed: <span className="badge badge-confirmed">Confirmé</span>,
    fixed:     <span className="badge badge-fixed">Réparé</span>,
  };

  if (error) return <p className="error">❌ {error}</p>;

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
        <h2 style={{margin:0}}>📋 Signalements</h2>
        {/* Boutons export — appellent directement l'URL du backend */}
        <div style={{display:"flex", gap:8}}>
          <a href={getExportUrl("excel", status)} style={{background:"#2E7D32", color:"white", padding:"8px 16px", borderRadius:8, textDecoration:"none", fontSize:14}}>
            📊 Excel
          </a>
          <a href={getExportUrl("pdf", status)} style={{background:"#C62828", color:"white", padding:"8px 16px", borderRadius:8, textDecoration:"none", fontSize:14}}>
            📄 PDF
          </a>
        </div>
      </div>

      {/* Filtres — identiques aux champs du formulaire JSP */}
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:12, alignItems:"end"}}>
          <div>
            <label style={{fontSize:12, fontWeight:600, display:"block", marginBottom:4}}>Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{width:"100%"}}>
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmés</option>
              <option value="fixed">Réparés</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:12, fontWeight:600, display:"block", marginBottom:4}}>Du</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{width:"100%"}} />
          </div>
          <div>
            <label style={{fontSize:12, fontWeight:600, display:"block", marginBottom:4}}>Au</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{width:"100%"}} />
          </div>
          <button className="btn-primary" onClick={loadReports} style={{height:38}}>
            🔍 Filtrer
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {loading ? (
          <p style={{padding:40, textAlign:"center", color:"#888"}}>Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Adresse</th>
                <th>Utilisateur</th>
                <th>IA</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{textAlign:"center", padding:40, color:"#888"}}>
                    Aucun signalement trouvé
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id}>
                    <td>
                      {r.photoUrl && (
                        <img
                          src={r.photoUrl}
                          alt="photo"
                          style={{width:60, height:50, objectFit:"cover", borderRadius:8, cursor:"pointer"}}
                          onClick={() => setModalPhoto(r)}
                        />
                      )}
                    </td>
                    <td>
                      <div style={{fontWeight:600, fontSize:13}}>{r.address}</div>
                      <div style={{color:"#888", fontSize:11}}>{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</div>
                    </td>
                    <td style={{fontSize:13}}>{r.userEmail}</td>
                    <td style={{textAlign:"center"}}>
                      {r.aiDetected
                        ? <><span style={{color:"#2E7D32", fontWeight:700}}>✅</span><div style={{fontSize:11, color:"#888"}}>{Math.round(r.aiConfidence * 100)}%</div></>
                        : <span style={{color:"#aaa"}}>—</span>
                      }
                    </td>
                    <td>{STATUS_BADGE[r.status] || <span className="badge">{r.status}</span>}</td>
                    <td style={{fontSize:13, color:"#888"}}>{r.formattedDate}</td>
                    <td>
                      <select
                        value={r.status}
                        onChange={e => handleUpdateStatus(r.id, e.target.value)}
                        style={{fontSize:12}}
                      >
                        <option value="pending">⏳ En attente</option>
                        <option value="confirmed">🔵 Confirmer</option>
                        <option value="fixed">✅ Réparé</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal photo — identique au modal Bootstrap de l'ancien reports.jsp */}
      {modalPhoto && (
        <div
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000}}
          onClick={() => setModalPhoto(null)}
        >
          <div style={{background:"white", borderRadius:16, overflow:"hidden", maxWidth:500, width:"90%"}} onClick={e => e.stopPropagation()}>
            <div style={{padding:"16px 20px", fontWeight:600, borderBottom:"1px solid #eee", display:"flex", justifyContent:"space-between"}}>
              <span>{modalPhoto.address}</span>
              <button onClick={() => setModalPhoto(null)} style={{background:"none", fontSize:18, color:"#888"}}>✕</button>
            </div>
            <img src={modalPhoto.photoUrl} alt="photo" style={{width:"100%", maxHeight:500, objectFit:"contain"}} />
          </div>
        </div>
      )}
    </div>
  );
}
