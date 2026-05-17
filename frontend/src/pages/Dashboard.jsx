import React, { useEffect, useState } from "react";
import { fetchDashboard, fetchReports, getLikes } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

const Icons = {
  Total: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Pending: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  Confirmed: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
  Fixed: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Resolution: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Time: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  AI: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  WeatherRain: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M4.93 4.93l2.83 2.83M19.07 4.93l-2.83 2.83"/>
      <path d="M20 12a4 4 0 0 0-8 0v4a4 4 0 0 0 8 0v-4z"/>
      <line x1="4" y1="14" x2="6" y2="14"/>
      <line x1="9" y1="18" x2="9" y2="20"/>
      <line x1="15" y1="18" x2="15" y2="20"/>
      <line x1="19" y1="14" x2="22" y2="14"/>
    </svg>
  ),
  WeatherSun: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Map: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Like: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
};

const extractZone = (address) => {
  if (!address) return "Non localisé";
  const postalMatch = address.match(/\d{5}/);
  if (postalMatch) {
    const parts = address.split(",");
    const zonePart = parts.find(p => p.includes(postalMatch[0]));
    if (zonePart) return zonePart.trim();
  }
  const parts = address.split(",");
  if (parts.length >= 2) return parts[parts.length - 2].trim();
  return address.substring(0, 35) + (address.length > 35 ? "..." : "");
};

const fetchWeatherRisk = async (lat, lng) => {
  try {
    const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
    const data = await response.json();
    return { score: data.score, condition: data.condition, description: data.description };
  } catch (error) {
    console.error("Erreur météo:", error);
    return { score: 0, condition: "Inconnu", description: "Météo non disponible" };
  }
};

const calculatePriority = (report, allReports, weatherScore = 0, likeCount = 0) => {
  let points = 0;
  const maxPoints = 20;

  // 1. Détection IA (max 6 points)
  if (report.aiDetected) {
    if (report.aiConfidence >= 0.8) points += 6;
    else if (report.aiConfidence >= 0.6) points += 4;
    else if (report.aiConfidence >= 0.4) points += 2;
  }

  // 2. Signalements à la même adresse (max 6 points)
  const sameAddress = allReports.filter(r =>
    r.address && report.address && r.address === report.address && r.id !== report.id
  ).length;
  if (sameAddress >= 3) points += 6;
  else if (sameAddress === 2) points += 4;
  else if (sameAddress === 1) points += 2;

  // 3. Ancienneté (max 4 points)
  const ageDays = (Date.now() - report.timestamp) / (1000 * 60 * 60 * 24);
  if (ageDays > 14) points += 4;
  else if (ageDays > 7) points += 2;
  else if (ageDays > 3) points += 1;

  // 4. Météo (max 4 points)
  points += weatherScore;

  // 5. LIKES / CONFIRMATIONS (max 4 points)
  if (likeCount >= 20) points += 4;
  else if (likeCount >= 10) points += 3;
  else if (likeCount >= 5) points += 2;
  else if (likeCount >= 1) points += 1;

  const percentage = Math.min(Math.round((points / maxPoints) * 100), 100);

  let level, color, bg;
  if (percentage >= 80) {
    level = "Critique";
    color = "#e74c3c";
    bg = "#fef2f2";
  } else if (percentage >= 60) {
    level = "Élevé";
    color = "#e67e22";
    bg = "#fef6ee";
  } else if (percentage >= 40) {
    level = "Moyen";
    color = "#f39c12";
    bg = "#fffbeb";
  } else {
    level = "Faible";
    color = "#27ae60";
    bg = "#f0faf4";
  }

  return { score: percentage, points, level, color, bg };
};

function StatCard({ icon: Icon, label, value, color, subLabel }) {
  return (
    <div className="stat-card" style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", color: color }}>
          <Icon />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--dark)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{label}</div>
      {subLabel && <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 2 }}>{subLabel}</div>}
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h3>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [topZones, setTopZones] = useState([]);
  const [priorityReports, setPriorityReports] = useState([]);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    loadDashboard();
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserEmail(userData.email);
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashData, allReports] = await Promise.all([
        fetchDashboard(),
        fetchReports({})
      ]);
      setStats(dashData);

      try {
        const weather = await fetchWeatherRisk(31.6295, -7.9811);
        if (weather.score > 0) {
          setWeatherAlert({
            condition: weather.condition,
            description: weather.description,
            message: `Météo : ${weather.description} - Risque de dégradation augmenté`
          });
        } else {
          setWeatherAlert(null);
        }
      } catch (e) {
        console.error("Erreur météo:", e);
      }

      // Récupérer les likes pour chaque signalement
      const reportsWithLikes = await Promise.all(
        allReports.map(async (report) => {
          let likeCount = 0;
          try {
            const likesData = await getLikes(report.id);
            likeCount = likesData.likeCount || 0;
          } catch (e) {
            console.error("Erreur récupération likes:", e);
          }
          return { ...report, likeCount };
        })
      );

      // Filtrer les signalements prioritaires (en attente ou confirmés)
      const activeReports = reportsWithLikes.filter(r => r.status === "pending" || r.status === "confirmed");

      const reportsWithWeather = await Promise.all(
        activeReports.map(async (report) => {
          let weatherScore = 0;
          let weatherCondition = "Sec";
          if (report.latitude && report.longitude) {
            const weather = await fetchWeatherRisk(report.latitude, report.longitude);
            weatherScore = weather.score;
            weatherCondition = weather.condition;
          }
          return {
            ...report,
            priority: calculatePriority(report, reportsWithLikes, weatherScore, report.likeCount),
            weatherScore,
            weatherCondition
          };
        })
      );

      const prioritized = reportsWithWeather
        .sort((a, b) => b.priority.score - a.priority.score)
        .slice(0, 5);

      setPriorityReports(prioritized);
      setLastUpdated(new Date());

      const zoneCount = new Map();
      allReports.forEach(r => {
        const zone = extractZone(r.address);
        zoneCount.set(zone, (zoneCount.get(zone) || 0) + 1);
      });
      setTopZones(
        Array.from(zoneCount.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
      );
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report) => {
    navigate("/map", { state: { selectedReportId: report.id } });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <span style={{ color: "var(--gray)", fontSize: 14 }}>Chargement des données...</span>
    </div>
  );

  if (!stats) return <div>Erreur de chargement</div>;

  const resolutionRate = stats.total > 0 ? Math.round((stats.fixed / stats.total) * 100) : 0;

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>Tableau de bord</h1>
          {lastUpdated && <p style={{ fontSize: 12, color: "var(--gray)" }}>Dernière mise à jour : {lastUpdated.toLocaleTimeString("fr-FR")}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {userEmail && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--light)", borderRadius: 40 }}>
              <Icons.User />
              <span style={{ fontSize: 12, color: "var(--dark)" }}>{userEmail}</span>
            </div>
          )}
          <button onClick={loadDashboard} className="btn btn-outline" style={{ fontSize: 13, padding: "8px 16px" }}>Actualiser</button>
          <NotificationBell />
        </div>
      </div>

      {/* Alerte météo */}
      {weatherAlert && (
        <div style={{ background: "#fff8e7", borderLeft: "4px solid #f39c12", borderRadius: "12px", padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 36, background: "rgba(243, 156, 18, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.WeatherRain />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e67e22" }}>Météo : {weatherAlert.condition}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{weatherAlert.message}</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="stat-grid" style={{ gap: 14, marginBottom: 24 }}>
        <StatCard icon={Icons.Total} label="Signalements totaux" value={stats.total} color="var(--primary)" />
        <StatCard icon={Icons.Pending} label="En attente" value={stats.pending} color="var(--warning)" subLabel={stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}% du total` : null} />
        <StatCard icon={Icons.Confirmed} label="Confirmés" value={stats.confirmed} color="var(--info)" />
        <StatCard icon={Icons.Fixed} label="Réparés" value={stats.fixed} color="var(--success)" subLabel={stats.total > 0 ? `${Math.round((stats.fixed / stats.total) * 100)}% du total` : null} />
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard icon={Icons.Resolution} label="Taux de résolution" value={`${resolutionRate}%`} color={resolutionRate >= 70 ? "var(--success)" : "var(--danger)"} subLabel={resolutionRate >= 70 ? "Objectif atteint" : "Objectif 70%"} />
        <StatCard icon={Icons.Time} label="Temps moyen" value={`${stats.avgRepair || 0} j`} color="var(--secondary)" subLabel="Délai de traitement" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* Signalements prioritaires */}
        <div className="card">
          <SectionHeader title="Signalements prioritaires" action={<Link to="/reports?status=pending" style={{ fontSize: 12, color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>Voir tout <Icons.ArrowRight /></Link>} />
          {priorityReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--gray)", fontSize: 13 }}>Aucun signalement prioritaire</div>
          ) : priorityReports.map((report, idx) => (
            <div key={report.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: idx < priorityReports.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }} onClick={() => handleReportClick(report)}>
              <div style={{ width: 4, height: 32, borderRadius: 2, background: report.priority.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{report.address || "Adresse inconnue"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--gray)", flexWrap: "wrap" }}>
                  {report.aiDetected && (<span style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--info)" }}><Icons.AI /> IA {Math.round(report.aiConfidence * 100)}%</span>)}
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icons.MapPin /> Score {report.priority.score}%</span>
                  {report.likeCount > 0 && (<span style={{ display: "flex", alignItems: "center", gap: 3, color: "#e67e22" }}><Icons.Like /> {report.likeCount} confirmation(s)</span>)}
                  <span style={{ display: "flex", alignItems: "center", gap: 3, color: report.weatherScore > 0 ? "#f39c12" : "#6c757d" }}><Icons.WeatherRain /> {report.weatherCondition && report.weatherCondition !== "Inconnu" ? report.weatherCondition : "Sec"}{report.weatherScore > 0 && ` +${report.weatherScore}`}</span>
                </div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: report.priority.color, background: report.priority.bg, flexShrink: 0 }}>{report.priority.level}</span>
            </div>
          ))}
        </div>

        {/* Zones */}
        <div className="card">
          <SectionHeader title="Zones les plus touchées" />
          {topZones.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--gray)", fontSize: 13 }}>Aucune donnée disponible</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {topZones.map((zone, idx) => {
                const pct = Math.round((zone.count / (stats.total || 1)) * 100);
                const colors = ["var(--danger)", "var(--warning)", "var(--info)"];
                return (
                  <div key={zone.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: colors[idx], color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{zone.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{zone.count} <span style={{ color: "var(--gray)", fontWeight: 400 }}>signalements</span></span>
                    </div>
                    <div style={{ height: 6, background: "var(--border)", borderRadius: 3 }}>
                      <div style={{ height: "100%", borderRadius: 3, background: colors[idx], width: `${pct}%`, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Carte */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, var(--secondary) 0%, var(--dark) 100%)", border: "none", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Map /></div>
          <div><div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Visualisation cartographique</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Cartographie en temps réel des signalements</div></div>
        </div>
        <Link to="/map" style={{ background: "var(--primary)", color: "white", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>Accéder <Icons.ArrowRight /></Link>
      </div>
    </div>
  );
}