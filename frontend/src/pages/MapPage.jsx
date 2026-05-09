import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { fetchReports, updateStatus } from "../services/api";
import { useLocation, useSearchParams } from "react-router-dom";

const Icons = {
  Map: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2 1,6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12,5 19,12 12,19"/>
    </svg>
  ),
};

function createIcon(status, isSelected = false) {
  const colors = { pending: "#f39c12", confirmed: "#3498db", fixed: "#27ae60" };
  const color = colors[status] || "#888";
  const size = isSelected ? 40 : 28;
  const border = isSelected ? "4px solid #e67e22" : "3px solid white";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:${border};box-shadow:0 2px 12px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size],
  });
}

function FitBounds({ reports, selectedReport }) {
  const map = useMap();

  useEffect(() => {
    if (selectedReport && selectedReport.latitude && selectedReport.longitude) {
      map.flyTo([selectedReport.latitude, selectedReport.longitude], 16, {
        duration: 1.5
      });
      return;
    }

    if (reports.length > 0) {
      const bounds = reports
        .filter(r => r.latitude && r.longitude)
        .map(r => [r.latitude, r.longitude]);
      if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [reports, selectedReport, map]);

  return null;
}

function ResetView({ reports, triggerReset, setSelectedReport }) {
  const map = useMap();
  useEffect(() => {
    if (triggerReset && reports.length > 0) {
      if (setSelectedReport) setSelectedReport(null);
      const bounds = reports
        .filter(r => r.latitude && r.longitude)
        .map(r => [r.latitude, r.longitude]);
      if (bounds.length > 0) map.flyToBounds(bounds, { padding: [40, 40], duration: 1.5 });
    }
  }, [triggerReset, reports, setSelectedReport, map]);
  return null;
}

const STATUS_LABELS = { pending: "En attente", confirmed: "Confirmé", fixed: "Réparé" };

export default function MapPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [resetView, setResetView] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Récupérer l'ID depuis le state OU depuis l'URL
  useEffect(() => {
    const reportId = location.state?.selectedReportId || searchParams.get("reportId");
    console.log("📍 ID récupéré depuis URL/state:", reportId);

    if (reportId && reports.length > 0) {
      const found = reports.find(r => r.id === reportId);
      if (found) {
        console.log("📍 Signalement trouvé:", found.address);
        setSelectedReport(found);
      } else {
        console.log("❌ Signalement non trouvé pour ID:", reportId);
      }
    }
  }, [location.state, searchParams, reports]);

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
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      alert("Erreur mise à jour : " + e.message);
    }
  }

  if (error) return <p style={{ color: "var(--danger)", padding: 20 }}>{error}</p>;

  return (
    <div className="fade-in">

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>Carte des signalements</h1>
          <p style={{ fontSize: 11, color: "var(--gray)" }}>
            {reports.length} signalement(s) localisé(s)
            {selectedReport && <span style={{ marginLeft: 12, color: "#e67e22" }}>📍 Signalement sélectionné</span>}
          </p>
        </div>
        <button
          onClick={() => {
            setResetView(v => !v);
            setSelectedReport(null);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            cursor: "pointer",
            background: "white",
            fontSize: 12,
            color: "var(--gray)"
          }}
        >
          <Icons.Map /> Vue globale <Icons.ArrowRight />
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: "10px 16px" }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50% 50% 50% 0", background: "#f39c12", transform: "rotate(-45deg)" }} />
            <span style={{ fontSize: 11, color: "var(--gray)" }}>En attente</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50% 50% 50% 0", background: "#3498db", transform: "rotate(-45deg)" }} />
            <span style={{ fontSize: 11, color: "var(--gray)" }}>Confirmé</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50% 50% 50% 0", background: "#27ae60", transform: "rotate(-45deg)" }} />
            <span style={{ fontSize: 11, color: "var(--gray)" }}>Réparé</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <MapContainer
          center={[35.7595, -5.8340]}
          zoom={13}
          style={{ height: 550, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds reports={reports} selectedReport={selectedReport} />
          <ResetView reports={reports} triggerReset={resetView} setSelectedReport={setSelectedReport} />

          <MarkerClusterGroup chunkedLoading>
            {reports
              .filter(r => r.latitude && r.longitude)
              .map(r => {
                const isSelected = selectedReport && selectedReport.id === r.id;
                return (
                  <Marker
                    key={r.id}
                    position={[r.latitude, r.longitude]}
                    icon={createIcon(r.status, isSelected)}
                  >
                    <Popup maxWidth={280}>
                      <div style={{ minWidth: 200, fontFamily: "'Inter', sans-serif" }}>
                        {r.photoUrl && (
                          <img
                            src={r.photoUrl}
                            alt="photo du signalement"
                            style={{
                              width: "100%",
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 8,
                              marginBottom: 12
                            }}
                            onError={e => e.target.style.display = "none"}
                          />
                        )}
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                          {r.address || "Adresse non renseignée"}
                        </div>
                        <div style={{ color: "#666", fontSize: 11, marginBottom: 8 }}>
                          {r.userEmail || "Utilisateur anonyme"}<br />
                          {r.timestamp ? new Date(r.timestamp).toLocaleDateString("fr-FR") : "Date inconnue"}
                        </div>
                        <div style={{ marginBottom: 10, fontSize: 12 }}>
                          Statut : <strong style={{ color: r.status === "pending" ? "#f39c12" : r.status === "confirmed" ? "#3498db" : "#27ae60" }}>
                            {STATUS_LABELS[r.status] || r.status}
                          </strong>
                        </div>
                        {r.aiDetected && (
                          <div style={{ color: "#27ae60", fontSize: 11, marginBottom: 10 }}>
                            Détection IA : {Math.round(r.aiConfidence * 100)}% de confiance
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                          <button
                            className="btn-warning"
                            onClick={() => handleUpdateStatus(r.id, "pending")}
                            style={{ fontSize: 11, padding: "4px 10px" }}
                          >
                            En attente
                          </button>
                          <button
                            className="btn-info"
                            onClick={() => handleUpdateStatus(r.id, "confirmed")}
                            style={{ fontSize: 11, padding: "4px 10px", background: "#3498db" }}
                          >
                            Confirmer
                          </button>
                          <button
                            className="btn-success"
                            onClick={() => handleUpdateStatus(r.id, "fixed")}
                            style={{ fontSize: 11, padding: "4px 10px", background: "#27ae60" }}
                          >
                            Réparé
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
            }
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}