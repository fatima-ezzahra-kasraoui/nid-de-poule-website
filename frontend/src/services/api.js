// services/api.js
// ─────────────────────────────────────────────────────────────────
// Centralise tous les appels vers le backend Spring Boot
// Ancien : fetch() éparpillé dans chaque JSP (dashboard.jsp, map.jsp, reports.jsp...)
// Nouveau : un seul fichier qui gère toute la communication API
// ─────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080/api";

// GET /api/dashboard → stats générales
export async function fetchDashboard() {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error("Erreur dashboard");
  return res.json();
}

// GET /api/stats → données graphiques
export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error("Erreur stats");
  return res.json();
}

// GET /api/reports?status=...&dateFrom=...&dateTo=...
export async function fetchReports({ status, dateFrom, dateTo } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.append("status", status);
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo)   params.append("dateTo", dateTo);

  const res = await fetch(`${BASE_URL}/reports?${params}`);
  if (!res.ok) throw new Error("Erreur chargement signalements");
  return res.json();
}

// POST /api/reports/{id}/status  body: { status: "confirmed" }
export async function updateStatus(reportId, newStatus) {
  const res = await fetch(`${BASE_URL}/reports/${reportId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) throw new Error("Erreur mise à jour statut");
  return res.json();
}

// GET /api/export?format=excel|pdf&status=...
export function getExportUrl(format, status) {
  const params = new URLSearchParams({ format });
  if (status && status !== "all") params.append("status", status);
  return `${BASE_URL}/export?${params}`;
}
