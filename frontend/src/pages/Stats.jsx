import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { fetchStats, fetchReports } from "../services/api";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler
);

const Icons = {
  AvgTime: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  PeakDay: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Trend: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
      <polyline points="17,6 23,6 23,12"/>
    </svg>
  ),
  Efficiency: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9-4-18-3 9H2"/>
    </svg>
  ),
};

function StatCard({ icon: Icon, label, value, subValue, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", color }}>
          <Icon />
        </div>
      </div>
      <div className="stat-number" style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div className="stat-label" style={{ fontSize: 12, marginTop: 4 }}>{label}</div>
      {subValue && <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4 }}>{subValue}</div>}
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        fetchStats(),
        fetchReports({})
      ]);
      setStats(statsData);

      const dayCount = new Array(7).fill(0);
      const weekCount = new Array(7).fill(0);
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

      reportsData.forEach(r => {
        const date = new Date(r.timestamp);
        const dayOfWeek = date.getDay();
        dayCount[dayOfWeek]++;

        if (r.timestamp >= oneWeekAgo) {
          weekCount[dayOfWeek]++;
        }
      });

      setDailyData(dayCount);
      setWeeklyTrend(weekCount);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p style={{ color: "var(--danger)", padding: 20 }}>{error}</p>;
  if (loading || !stats) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const monthLabels = Object.keys(stats.byMonth || {});
  const monthData = Object.values(stats.byMonth || {});
  const total = stats.byStatus?.total || 0;
  const fixed = stats.byStatus?.fixed || 0;
  const pending = stats.byStatus?.pending || 0;
  const confirmed = stats.byStatus?.confirmed || 0;
  const resolutionRate = total > 0 ? Math.round((fixed / total) * 100) : 0;
  const avgRepairDays = stats.avgRepairDays || 0;

  const currentMonthTotal = monthData[monthData.length - 1] || 0;
  const previousMonthTotal = monthData[monthData.length - 2] || 0;
  const trend = previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal * 100).toFixed(0) : 0;
  const trendIsPositive = trend > 0;

  const efficiencyData = monthLabels.map((_, i) => {
    const monthFixed = monthData[i] || 0;
    return monthFixed > 0 ? Math.round((monthFixed / (monthData[i] || 1)) * 100) : 0;
  });

  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const maxDayIndex = dailyData.indexOf(Math.max(...dailyData));
  const peakDayName = dayNames[maxDayIndex] || "-";
  const peakDayValue = Math.max(...dailyData);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>Analyses statistiques</h1>
        <p style={{ fontSize: 12, color: "var(--gray)" }}>Performances, tendances et indicateurs avancés</p>
      </div>

      <div className="stat-grid">
        <StatCard
          icon={Icons.AvgTime}
          label="Temps moyen de résolution"
          value={`${avgRepairDays} jours`}
          subValue={avgRepairDays <= 7 ? "Objectif atteint" : avgRepairDays <= 14 ? "À surveiller" : "Hors objectif"}
          color="var(--primary)"
        />
        <StatCard
          icon={Icons.PeakDay}
          label="Pic d'activité"
          value={peakDayName}
          subValue={`${peakDayValue} signalements`}
          color="var(--warning)"
        />
        <StatCard
          icon={Icons.Trend}
          label="Tendance mensuelle"
          value={`${trend > 0 ? '+' : ''}${trend}%`}
          subValue={trendIsPositive ? "Hausse d'activité" : "Baisse d'activité"}
          color={trendIsPositive ? "var(--danger)" : "var(--success)"}
        />
        <StatCard
          icon={Icons.Efficiency}
          label="Efficacité de traitement"
          value={`${resolutionRate}%`}
          subValue={resolutionRate >= 80 ? "Excellent" : resolutionRate >= 60 ? "Correct" : "À améliorer"}
          color="var(--info)"
        />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Évolution des signalements
          </div>
          <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4 }}>
            Tendance mensuelle des nouveaux signalements
          </div>
        </div>
        {monthLabels.length > 0 ? (
          <Line
            data={{
              labels: monthLabels,
              datasets: [
                {
                  label: "Nouveaux signalements",
                  data: monthData,
                  borderColor: "var(--primary)",
                  backgroundColor: "rgba(230, 126, 34, 0.05)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointBackgroundColor: "var(--primary)",
                  pointBorderColor: "white",
                  pointBorderWidth: 2,
                },
                {
                  label: "Taux d'efficacité",
                  data: efficiencyData,
                  borderColor: "var(--success)",
                  backgroundColor: "transparent",
                  borderDash: [5, 5],
                  tension: 0.4,
                  pointRadius: 3,
                  pointBackgroundColor: "var(--success)",
                  yAxisID: "y1",
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                tooltip: { mode: "index", intersect: false },
                legend: { position: "top", labels: { font: { size: 11 }, usePointStyle: true } },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Nombre de signalements", font: { size: 10 } },
                  grid: { color: "#f0f0f0" }
                },
                y1: {
                  position: "right",
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: "Efficacité (%)", font: { size: 10 } },
                  grid: { drawOnChartArea: false },
                },
                x: { grid: { display: false } }
              },
            }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--gray)", fontSize: 13 }}>
            Aucune donnée disponible
          </div>
        )}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Activité par jour
            </div>
            <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4 }}>
              Volume de signalements par jour de semaine
            </div>
          </div>
          <Bar
            data={{
              labels: dayNames,
              datasets: [
                {
                  label: "Historique total",
                  data: dailyData,
                  backgroundColor: "rgba(230, 126, 34, 0.4)",
                  borderRadius: 6,
                },
                {
                  label: "7 derniers jours",
                  data: weeklyTrend,
                  backgroundColor: "var(--primary)",
                  borderRadius: 6,
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: { legend: { position: "top", labels: { font: { size: 10 } } } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "#f0f0f0" } }, x: { grid: { display: false } } },
            }}
          />
          <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 12, textAlign: "center" }}>
            Les jours de forte activité nécessitent une attention accrue
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Répartition des statuts
            </div>
            <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 4 }}>
              État actuel du traitement
            </div>
          </div>
          <Doughnut
            data={{
              labels: [`En attente (${pending})`, `Confirmés (${confirmed})`, `Réparés (${fixed})`],
              datasets: [{
                data: [pending, confirmed, fixed],
                backgroundColor: ["#f39c12", "#3498db", "#27ae60"],
                borderWidth: 0,
              }],
            }}
            options={{
              cutout: "60%",
              plugins: {
                legend: { position: "bottom", labels: { padding: 12, font: { size: 11 }, usePointStyle: true } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} (${Math.round((ctx.raw / total) * 100)}%)` } }
              }
            }}
          />
          <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 12, textAlign: "center" }}>
            Taux de traitement : {resolutionRate}% des signalements résolus
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24, background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)", color: "white", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Performance globale</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{resolutionRate}%</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>taux de résolution sur l'ensemble</div>
          </div>
          <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.3)" }} />
          <div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Tendance</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{trend > 0 ? `+${trend}` : trend}%</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>vs mois précédent</div>
          </div>
          <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.3)" }} />
          <div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Pic d'activité</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{peakDayValue}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>signalements en un jour</div>
          </div>
        </div>
      </div>
    </div>
  );
}