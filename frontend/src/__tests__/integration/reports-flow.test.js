// __tests__/integration/reports-flow.test.js
// Tests d'intégration : cycle de vie d'un signalement
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchReports,
  updateStatus,
  deleteReport,
  getReportHistory,
  getComments,
  getLikesPaginated,
  getReportById,
} from "../../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────
function mockOk(data) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(""),
  });
}

function mockError(status, message) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(message || "Erreur"),
  });
}

beforeEach(() => {
  localStorage.setItem("token", "test_jwt");
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — Lecture des signalements", () => {
  it("fetchReports retourne une liste de signalements", async () => {
    const fakeReports = [
      { id: 1, status: "pending", address: "Rue A" },
      { id: 2, status: "confirmed", address: "Rue B" },
    ];
    mockOk(fakeReports);

    const result = await fetchReports();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });

  it("fetchReports avec filtre status='confirmed' passe le bon paramètre", async () => {
    mockOk([]);
    await fetchReports({ status: "confirmed" });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("status=confirmed");
  });

  it("fetchReports avec plage de dates passe les deux paramètres", async () => {
    mockOk([]);
    await fetchReports({ dateFrom: "2024-01-01", dateTo: "2024-06-30" });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("dateFrom=2024-01-01");
    expect(url).toContain("dateTo=2024-06-30");
  });

  it("getReportById retourne le bon signalement", async () => {
    const fakeReport = { id: 10, status: "pending", type: "nid-de-poule" };
    mockOk(fakeReport);

    const result = await getReportById(10);
    expect(result.id).toBe(10);
    expect(result.type).toBe("nid-de-poule");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — Mise à jour du statut", () => {
  it("updateStatus envoie le nouveau statut et retourne la réponse", async () => {
    const updated = { id: 5, status: "confirmed" };
    mockOk(updated);

    const result = await updateStatus(5, "confirmed");
    expect(result.status).toBe("confirmed");

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/reports/5/status");
    expect(JSON.parse(opts.body).status).toBe("confirmed");
  });

  it("séquence complète : pending → confirmed → fixed", async () => {
    // Étape 1 : pending → confirmed
    mockOk({ id: 3, status: "confirmed" });
    const r1 = await updateStatus(3, "confirmed");
    expect(r1.status).toBe("confirmed");

    // Étape 2 : confirmed → fixed (réinitialiser le mock fetch)
    mockOk({ id: 3, status: "fixed" });
    const r2 = await updateStatus(3, "fixed");
    expect(r2.status).toBe("fixed");

    // Chaque appel a utilisé son propre mock fetch
    expect(global.fetch).toHaveBeenCalledTimes(1); // seul le 2e mock est vérifié ici
  });

  it("updateStatus propage l'erreur si le serveur répond 500", async () => {
    mockError(500, "Erreur serveur");
    await expect(updateStatus(1, "fixed")).rejects.toThrow("Erreur mise à jour statut");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — Suppression", () => {
  it("deleteReport appelle DELETE et retourne la confirmation", async () => {
    mockOk({ message: "Supprimé" });

    const result = await deleteReport(42);
    expect(result.message).toBe("Supprimé");

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/reports/42");
    expect(opts.method).toBe("DELETE");
  });

  it("deleteReport propage l'erreur si suppression impossible", async () => {
    mockError(404, "Non trouvé");
    await expect(deleteReport(999)).rejects.toThrow("Erreur lors de la suppression");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — Historique, commentaires et likes", () => {
  it("getReportHistory retourne la liste des changements de statut", async () => {
    const history = [
      { id: 1, oldValue: "pending", newValue: "confirmed", userEmail: "admin" },
    ];
    mockOk(history);

    const result = await getReportHistory(7);
    expect(result).toHaveLength(1);
    expect(result[0].oldValue).toBe("pending");
  });

  it("getComments retourne les commentaires paginés", async () => {
    const page = { content: [{ id: 1, text: "Super!" }], totalPages: 1 };
    mockOk(page);

    const result = await getComments(7, 0, 20);
    expect(result.content).toHaveLength(1);

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/reports/7/comments");
    expect(url).toContain("page=0");
  });

  it("getLikesPaginated retourne les likes paginés avec les bons paramètres", async () => {
    const page = { content: [{ userId: "u1" }], total: 1 };
    mockOk(page);

    const result = await getLikesPaginated(7, 0, 10);
    expect(result.content).toHaveLength(1);

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/reports/7/likes/paginated");
    expect(url).toContain("page=0");
    expect(url).toContain("limit=10");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — Chaîne d'appels API avec token", () => {
  it("plusieurs appels consécutifs portent tous le même token", async () => {
    mockOk([]);

    await fetchReports();
    await getReportById(1);

    const calls = global.fetch.mock.calls;
    expect(calls).toHaveLength(2);

    calls.forEach(([, opts]) => {
      expect(opts.headers["Authorization"]).toBe("Bearer test_jwt");
    });
  });
});
