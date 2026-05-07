// services/api.js
// ─────────────────────────────────────────────────────────────────
// Centralise tous les appels vers le backend Spring Boot
// Ancien : fetch() éparpillé dans chaque JSP (dashboard.jsp, map.jsp, reports.jsp...)
// Nouveau : un seul fichier qui gère toute la communication API
// ─────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080/api";

// Récupérer le token depuis localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Fonction helper pour les requêtes authentifiées
async function fetchWithAuth(url, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Si non autorisé (token expiré), rediriger vers login
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Session expirée, veuillez vous reconnecter");
  }

  return response;
}

// GET /api/dashboard → stats générales
export async function fetchDashboard() {
  const res = await fetchWithAuth("/dashboard");
  if (!res.ok) throw new Error("Erreur dashboard");
  return res.json();
}

// GET /api/stats → données graphiques
export async function fetchStats() {
  const res = await fetchWithAuth("/stats");
  if (!res.ok) throw new Error("Erreur stats");
  return res.json();
}

// GET /api/reports?status=...&dateFrom=...&dateTo=...
export async function fetchReports({ status, dateFrom, dateTo } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.append("status", status);
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo)   params.append("dateTo", dateTo);

  const res = await fetchWithAuth(`/reports?${params}`);
  if (!res.ok) throw new Error("Erreur chargement signalements");
  return res.json();
}

// POST /api/reports/{id}/status  body: { status: "confirmed" }
export async function updateStatus(reportId, newStatus) {
  const res = await fetchWithAuth(`/reports/${reportId}/status`, {
    method: "POST",
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) throw new Error("Erreur mise à jour statut");
  return res.json();
}

// GET /api/export?format=excel|pdf&status=...
export function getExportUrl(format, status) {
  const params = new URLSearchParams({ format });
  if (status && status !== "all") params.append("status", status);
  const token = getToken();
  return `${BASE_URL}/export?${params}&token=${token}`;
}

// Pour les exports avec téléchargement direct (avec token)
export async function downloadExport(format, status) {
  const token = getToken();
  const params = new URLSearchParams({ format });
  if (status && status !== "all") params.append("status", status);

  const response = await fetch(`${BASE_URL}/export?${params}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erreur export");

  // Télécharger le fichier
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signalements.${format === "excel" ? "xlsx" : "pdf"}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// GET /api/users
export async function getUsers() {
  const res = await fetchWithAuth("/users");
  return res.json();
}

// GET /api/users/stats
export async function getUserStats() {
  const res = await fetchWithAuth("/users/stats");
  return res.json();
}

// POST /api/users/{uid}/disable
export async function disableUser(uid) {
  const res = await fetchWithAuth(`/users/${uid}/disable`, { method: "POST" });
  return res.json();
}

// POST /api/users/{uid}/enable
export async function enableUser(uid) {
  const res = await fetchWithAuth(`/users/${uid}/enable`, { method: "POST" });
  return res.json();
}

// DELETE /api/users/{uid}
export async function deleteUser(uid) {
  const res = await fetchWithAuth(`/users/${uid}`, { method: "DELETE" });
  return res.json();
}

// DELETE /api/reports/{id}
export async function deleteReport(id) {
  const res = await fetchWithAuth(`/reports/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression");
  return res.json();
}
// GET /api/reports/{id}/history
export async function getReportHistory(id) {
  const res = await fetchWithAuth(`/reports/${id}/history`);
  if (!res.ok) {
    const error = await res.text();
    console.error("Erreur API:", res.status, error);
    throw new Error(`Erreur chargement historique: ${res.status}`);
  }
  return res.json();
}