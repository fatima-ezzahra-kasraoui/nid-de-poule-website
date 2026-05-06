import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { fetchStats } from "../services/api";

/**
 * Remplace stats.jsp
 */
export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <p className="error">❌ {error}</p>;
  if (!stats) return <p>Chargement...</p>;

  const monthLabels = Object.keys(stats.byMonth);
  const monthData   = Object.values(stats.byMonth);

  return (
    <div>
      <h2>📈 Statistiques détaillées</h2>

      {/* Chiffres clés */}
      <div className="stat-grid" style={{marginBottom:24}}>
        <div className="stat-card">
          <div style={{fontSize:28}}>🚧</div>
          <div className="stat-number" style={{color:"#1976D2"}}>{stats.byStatus.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:28}}>⏳</div>
          <div className="stat-number" style={{color:"#FF9800"}}>{stats.byStatus.pending}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:28}}>🔵</div>
          <div className="stat-number" style={{color:"#2196F3"}}>{stats.byStatus.confirmed}</div>
          <div className="stat-label">Confirmés</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:28}}>⏱️</div>
          <div className="stat-number" style={{color:"#555"}}>{stats.avgRepairDays}j</div>
          <div className="stat-label">Moy. réparation</div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        <div className="card">
          <h3 style={{marginBottom:16, fontSize:16}}>📊 Évolution mensuelle</h3>
          <Bar
            data={{
              labels: monthLabels,
              datasets: [{
                label: "Signalements",
                data: monthData,
                backgroundColor: "rgba(25,118,210,0.7)",
                borderRadius: 6,
              }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            }}
          />
        </div>

        <div className="card">
          <h3 style={{marginBottom:16, fontSize:16}}>🍩 Répartition</h3>
          <Doughnut
            data={{
              labels: ["En attente", "Confirmés", "Réparés"],
              datasets: [{
                data: [stats.byStatus.pending, stats.byStatus.confirmed, stats.byStatus.fixed],
                backgroundColor: ["#FF9800", "#2196F3", "#4CAF50"],
              }],
            }}
            options={{ plugins: { legend: { position: "bottom" } } }}
          />
        </div>
      </div>
    </div>
  );
}
