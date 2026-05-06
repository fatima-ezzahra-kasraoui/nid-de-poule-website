import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { fetchReports, updateStatus } from "../services/api";

function createIcon(status) {
  const colors = { pending: "#FF9800", confirmed: "#2196F3", fixed: "#4CAF50" };
  const color = colors[status] || "#888";
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -32],
  });
}

function FitBounds({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (reports.length > 0) {
      const bounds = reports
        .filter(r => r.latitude && r.longitude)
        .map(r => [r.latitude, r.longitude]);
      if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [reports]);
  return null;
}

function ResetView({ reports, triggerReset }) {
  const map = useMap();
  useEffect(() => {
    if (triggerReset && reports.length > 0) {
      const bounds = reports
        .filter(r => r.latitude && r.longitude)
        .map(r => [r.latitude, r.longitude]);
      if (bounds.length > 0) map.flyToBounds(bounds, { padding: [40, 40], duration: 1.5 });
    }
  }, [triggerReset]);
  return null;
}

const STATUS_LABELS = { pending: "⏳ En attente", confirmed: "🔵 Confirmé", fixed: "✅ Réparé" };

export default function MapPage() {
  const [reports, setReports]     = useState([]);
  const [error, setError]         = useState(null);
  const [resetView, setResetView] = useState(false);

  useEffect(() => {
    fetchReports()
      .then(setReports)
      .catch(e => setError(e.message));
  }, []);

  async function handleUpdateStatus(reportId, newStatus) {
    try {
      await updateStatus(reportId, newStatus);
      setReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
      );
    } catch (e) {
      alert("Erreur mise à jour : " + e.message);
    }
  }

  if (error) return <p className="error">❌ {error}</p>;

  return (
    <div>
      <h2>🗺️ Carte des signalements</h2>

      <div style={{display:"flex", gap:12, marginBottom:16, flexWrap:"wrap", alignItems:"center"}}>
        <span className="badge badge-pending">🟡 En attente</span>
        <span className="badge badge-confirmed">🔵 Confirmé</span>
        <span className="badge badge-fixed">🟢 Réparé</span>
        <button
          onClick={() => setResetView(v => !v)}
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "#f5f5f5",
            fontSize: 13,
          }}
        >
          🔍 Vue globale
        </button>
      </div>

      <div className="card" style={{padding:0, overflow:"hidden"}}>
        <MapContainer
          center={[35.7595, -5.8340]}
          zoom={13}
          style={{height:600, width:"100%"}}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds reports={reports} />
          <ResetView reports={reports} triggerReset={resetView} />

          {/* ✅ MarkerClusterGroup remplace les Markers directs */}
          <MarkerClusterGroup chunkedLoading>
            {reports
              .filter(r => r.latitude && r.longitude)
              .map(r => (
                <Marker
                  key={r.id}
                  position={[r.latitude, r.longitude]}
                  icon={createIcon(r.status)}
                >
                  <Popup maxWidth={280}>
                    <div style={{minWidth:220, fontFamily:"Segoe UI,sans-serif"}}>
                      {r.photoUrl && (
                        <img
                          src={r.photoUrl}
                          alt="photo"
                          style={{width:"100%", height:140, objectFit:"cover", borderRadius:8, marginBottom:10}}
                          onError={e => e.target.style.display = "none"}
                        />
                      )}
                      <div style={{fontWeight:"bold", marginBottom:4}}>
                        📍 {r.address || "Adresse inconnue"}
                      </div>
                      <div style={{color:"#666", fontSize:12, marginBottom:8}}>
                        👤 {r.userEmail || "Anonyme"}<br/>
                        📅 {r.timestamp ? new Date(r.timestamp).toLocaleDateString("fr-FR") : ""}
                      </div>
                      <div style={{marginBottom:8}}>
                        Statut : <strong>{STATUS_LABELS[r.status] || r.status}</strong>
                      </div>
                      {r.aiDetected && (
                        <div style={{color:"green", fontSize:12, marginBottom:8}}>
                          🤖 IA détecté ({Math.round(r.aiConfidence * 100)}%)
                        </div>
                      )}
                      <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
                        <button className="btn-warning" onClick={() => handleUpdateStatus(r.id, "pending")}>En attente</button>
                        <button className="btn-info"    onClick={() => handleUpdateStatus(r.id, "confirmed")}>Confirmer</button>
                        <button className="btn-success" onClick={() => handleUpdateStatus(r.id, "fixed")}>Réparé ✅</button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))
            }
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}