import { useEffect, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { fetchDashboard, fetchStats } from "../services/api";
import { Link } from "react-router-dom";

Chart.register(...registerables);

/**
 * Remplace dashboard.jsp
 * Ancien : le Servlet injectait ${total}, ${pending}... dans le JSP
 * Nouveau : on fetch() l'API et on stocke dans le state React
 */
export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [charts, setCharts]   = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchStats()])
      .then(([dashData, chartData]) => {
        setStats(dashData);
        setCharts(chartData);
      })
      .catch(e => setError(e.message));
  }, []);

  if (error) return <p className="error">❌ {error}</p>;
  if (!stats) return <p>Chargement...</p>;

  // Données pour le graphique ligne (signalements par mois)
  const monthLabels = charts ? Object.keys(charts.byMonth) : [];
  const monthData   = charts ? Object.values(charts.byMonth) : [];

  return (
    <div>
      <h2>📊 Tableau de bord</h2>

      {/* 4 cartes stats — identiques visuellement aux cards de dashboard.jsp */}
      <div className="stat-grid">
        <div className="stat-card">
          <div style={{fontSize:32}}>🚧</div>
          <div className="stat-number" style={{color:"#1976D2"}}>{stats.total}</div>
          <div className="stat-label">Total signalements</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:32}}>⏳</div>
          <div className="stat-number" style={{color:"#FF9800"}}>{stats.pending}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:32}}>🔵</div>
          <div className="stat-number" style={{color:"#2196F3"}}>{stats.confirmed}</div>
          <div className="stat-label">Confirmés</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:32}}>✅</div>
          <div className="stat-number" style={{color:"#4CAF50"}}>{stats.fixed}</div>
          <div className="stat-label">Réparés</div>
        </div>
      </div>

      {/* Graphiques */}
      {charts && (
        <div className="charts-grid">
          <div className="card">
            <h3 style={{marginBottom:16, fontSize:16}}>📈 Signalements par mois</h3>
            <Line
              data={{
                labels: monthLabels,
                datasets: [{
                  label: "Signalements",
                  data: monthData,
                  borderColor: "#1976D2",
                  backgroundColor: "rgba(25,118,210,0.1)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 5,
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className="card">
            <h3 style={{marginBottom:16, fontSize:16}}>🍩 Répartition des statuts</h3>
            <Doughnut
              data={{
                labels: ["En attente", "Confirmés", "Réparés"],
                datasets: [{
                  data: [charts.byStatus.pending, charts.byStatus.confirmed, charts.byStatus.fixed],
                  backgroundColor: ["#FF9800", "#2196F3", "#4CAF50"],
                }],
              }}
              options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
            />
          </div>
        </div>
      )}

      {/* Temps moyen + lien carte */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 2fr", gap:16, marginTop:20}}>
        <div className="card" style={{background:"#212121", color:"white", textAlign:"center"}}>
          <div style={{fontSize:40}}>⏱️</div>
          <div style={{fontSize:32, fontWeight:700}}>{stats.avgRepair} jours</div>
          <div style={{color:"#aaa", fontSize:13}}>Temps moyen de réparation</div>
        </div>
        <div className="card" style={{background:"linear-gradient(135deg,#1976D2,#42A5F5)", color:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:40}}>🗺️</div>
          <div style={{fontWeight:700, fontSize:18, margin:"8px 0"}}>Voir tous les signalements sur la carte</div>
          <Link to="/map" style={{background:"white", color:"#1976D2", padding:"8px 24px", borderRadius:8, fontWeight:600, textDecoration:"none"}}>
            Ouvrir la carte
          </Link>
        </div>
      </div>
    </div>
  );
}
