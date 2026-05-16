// __tests__/services/api.test.js
// Tests unitaires du service API (fetchWithAuth + fonctions métier)
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchDashboard,
  fetchStats,
  fetchReports,
  updateStatus,
  getExportUrl,
  getUsers,
  getUserStats,
  disableUser,
  enableUser,
  deleteUser,
  deleteReport,
  getReportHistory,
  getComments,
  deleteComment,
  getLikes,
  getLikesPaginated,
  getReportById,
} from "../../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────
function mockOk(data) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob()),
  });
}

function mockError(status = 500) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("Erreur serveur"),
  });
}

function mockUnauthorized() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("Unauthorized"),
  });
}

function setToken(token = "test_token") {
  localStorage.setItem("token", token);
}

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — fetchWithAuth : headers Authorization", () => {
  it("ajoute le header Authorization si un token est présent", async () => {
    setToken("my_jwt");
    mockOk({ total: 5 });

    await fetchDashboard();

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBe("Bearer my_jwt");
  });

  it("n'ajoute pas le header Authorization si aucun token", async () => {
    mockOk({});

    await fetchDashboard();

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBeUndefined();
  });

  it("redirige vers / et vide le localStorage si 401", async () => {
    setToken("expired_token");
    mockUnauthorized();

    await expect(fetchDashboard()).rejects.toThrow("Session expirée");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(window.location.href).toBe("/");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — fetchDashboard()", () => {
  it("appelle GET /api/dashboard", async () => {
    mockOk({ total: 10, pending: 3 });

    await fetchDashboard();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/dashboard",
      expect.any(Object)
    );
  });

  it("retourne les données JSON", async () => {
    const data = { total: 10, pending: 3 };
    mockOk(data);

    const result = await fetchDashboard();
    expect(result).toEqual(data);
  });

  it("lève une erreur si la réponse n'est pas ok", async () => {
    mockError(500);
    await expect(fetchDashboard()).rejects.toThrow("Erreur dashboard");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — fetchStats()", () => {
  it("appelle GET /api/stats", async () => {
    mockOk([]);
    await fetchStats();
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/stats",
      expect.any(Object)
    );
  });

  it("lève une erreur si la réponse n'est pas ok", async () => {
    mockError();
    await expect(fetchStats()).rejects.toThrow("Erreur stats");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — fetchReports()", () => {
  it("appelle /api/reports sans paramètres si aucun filtre", async () => {
    mockOk([]);
    await fetchReports();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports");
  });

  it("ajoute le paramètre status si fourni (et != 'all')", async () => {
    mockOk([]);
    await fetchReports({ status: "pending" });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("status=pending");
  });

  it("n'ajoute pas status=all dans la query string", async () => {
    mockOk([]);
    await fetchReports({ status: "all" });
    const [url] = global.fetch.mock.calls[0];
    expect(url).not.toContain("status=all");
  });

  it("ajoute les paramètres dateFrom et dateTo si fournis", async () => {
    mockOk([]);
    await fetchReports({ dateFrom: "2024-01-01", dateTo: "2024-12-31" });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("dateFrom=2024-01-01");
    expect(url).toContain("dateTo=2024-12-31");
  });

  it("lève une erreur si la réponse n'est pas ok", async () => {
    mockError();
    await expect(fetchReports()).rejects.toThrow("Erreur chargement signalements");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — updateStatus()", () => {
  it("appelle POST /api/reports/{id}/status avec le bon body", async () => {
    mockOk({ id: 42, status: "confirmed" });

    await updateStatus(42, "confirmed");

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports/42/status");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ status: "confirmed" });
  });

  it("lève une erreur si la réponse n'est pas ok", async () => {
    mockError();
    await expect(updateStatus(1, "fixed")).rejects.toThrow("Erreur mise à jour statut");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — getExportUrl()", () => {
  it("retourne l'URL d'export avec format=excel", () => {
    setToken("tok123");
    const url = getExportUrl("excel");
    expect(url).toContain("format=excel");
    expect(url).toContain("token=tok123");
  });

  it("inclut le paramètre status si fourni (et != 'all')", () => {
    setToken("tok");
    const url = getExportUrl("pdf", "pending");
    expect(url).toContain("status=pending");
  });

  it("n'inclut pas status=all", () => {
    setToken("tok");
    const url = getExportUrl("pdf", "all");
    expect(url).not.toContain("status=all");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — gestion des utilisateurs", () => {
  it("getUsers() appelle GET /api/users", async () => {
    mockOk([]);
    await getUsers();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/users");
  });

  it("getUserStats() appelle GET /api/users/stats", async () => {
    mockOk({});
    await getUserStats();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/users/stats");
  });

  it("disableUser(uid) appelle POST /api/users/{uid}/disable", async () => {
    mockOk({});
    await disableUser(7);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/users/7/disable");
    expect(opts.method).toBe("POST");
  });

  it("enableUser(uid) appelle POST /api/users/{uid}/enable", async () => {
    mockOk({});
    await enableUser(7);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/users/7/enable");
    expect(opts.method).toBe("POST");
  });

  it("deleteUser(uid) appelle DELETE /api/users/{uid}", async () => {
    mockOk({});
    await deleteUser(7);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/users/7");
    expect(opts.method).toBe("DELETE");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — gestion des signalements", () => {
  it("deleteReport(id) appelle DELETE /api/reports/{id}", async () => {
    mockOk({});
    await deleteReport(99);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports/99");
    expect(opts.method).toBe("DELETE");
  });

  it("deleteReport() lève une erreur si réponse non ok", async () => {
    mockError();
    await expect(deleteReport(99)).rejects.toThrow("Erreur lors de la suppression");
  });

  it("getReportHistory(id) appelle GET /api/reports/{id}/history", async () => {
    mockOk([]);
    await getReportHistory(5);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports/5/history");
  });

  it("getReportHistory() lève une erreur si réponse non ok", async () => {
    mockError(404);
    await expect(getReportHistory(5)).rejects.toThrow("Erreur chargement historique");
  });

  it("getReportById(id) appelle GET /api/reports/{id}", async () => {
    mockOk({ id: 1 });
    await getReportById(1);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports/1");
  });

  it("getReportById() lève une erreur si réponse non ok", async () => {
    mockError(404);
    await expect(getReportById(1)).rejects.toThrow("Erreur chargement signalement");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("api.js — commentaires & likes", () => {
  it("getComments(reportId) appelle GET /api/reports/{id}/comments", async () => {
    mockOk({ content: [] });
    await getComments(3);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports/3/comments");
  });

  it("getComments() utilise page et limit par défaut (0 et 20)", async () => {
    mockOk({ content: [] });
    await getComments(3);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("page=0");
    expect(url).toContain("limit=20");
  });

  it("deleteComment() appelle DELETE avec le bon chemin", async () => {
    mockOk({});
    await deleteComment(3, 10);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports/3/comments/10");
    expect(opts.method).toBe("DELETE");
  });

  it("getLikes(reportId) appelle GET /api/reports/{id}/likes", async () => {
    mockOk([]);
    await getLikes(4);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/reports/4/likes");
  });

  it("getLikesPaginated() ajoute page et limit dans l'URL", async () => {
    mockOk({ content: [] });
    await getLikesPaginated(4, 1, 10);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });

  it("getLikesPaginated() lève une erreur si réponse non ok", async () => {
    mockError();
    await expect(getLikesPaginated(4)).rejects.toThrow("Erreur chargement likes");
  });
});
