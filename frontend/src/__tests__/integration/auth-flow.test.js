// __tests__/integration/auth-flow.test.js
// Tests d'intégration : flux d'authentification complet
// Vérifie l'interaction entre auth.js et le stockage localStorage
import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, logout, isAuthenticated, getToken, getUser } from "../../services/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────
function mockFetchOk(data) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchFail(errorMsg) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: errorMsg }),
  });
}

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — Flux login complet", () => {
  it("scénario nominal : login → isAuthenticated → getUser → logout", async () => {
    // 1. Au départ : pas authentifié
    expect(isAuthenticated()).toBe(false);
    expect(getUser()).toBeNull();

    // 2. Login réussi
    mockFetchOk({ token: "jwt_integration", email: "admin@rw.fr", role: "ADMIN" });
    await login("admin@rw.fr", "pass123");

    // 3. Maintenant authentifié
    expect(isAuthenticated()).toBe(true);
    expect(getToken()).toBe("jwt_integration");
    const user = getUser();
    expect(user).not.toBeNull();
    expect(user.email).toBe("admin@rw.fr");
    expect(user.role).toBe("ADMIN");

    // 4. Logout → plus authentifié
    logout();
    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });

  it("login échoué : l'état reste non-authentifié", async () => {
    mockFetchFail("Identifiants invalides");

    try {
      await login("bad@rw.fr", "wrong");
    } catch (e) {
      expect(e.message).toBe("Identifiants invalides");
    }

    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
  });

  it("deux logins successifs : le second token remplace le premier", async () => {
    mockFetchOk({ token: "token_v1", email: "u1@rw.fr", role: "ADMIN" });
    await login("u1@rw.fr", "pass");
    expect(getToken()).toBe("token_v1");

    mockFetchOk({ token: "token_v2", email: "u2@rw.fr", role: "ADMIN" });
    await login("u2@rw.fr", "pass");
    expect(getToken()).toBe("token_v2");
    expect(getUser().email).toBe("u2@rw.fr");
  });

  it("logout sans login préalable ne lève pas d'erreur", () => {
    expect(() => logout()).not.toThrow();
    expect(isAuthenticated()).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — API avec token", () => {
  it("le token stocké après login est utilisé dans les requêtes API", async () => {
    // Login pour stocker le token
    mockFetchOk({ token: "bearer_tok", email: "admin@rw.fr", role: "ADMIN" });
    await login("admin@rw.fr", "pass");

    // Appel API suivant doit porter ce token
    const { fetchDashboard } = await import("../../services/api");
    mockFetchOk({ total: 5 });
    await fetchDashboard();

    const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const [, opts] = lastCall;
    expect(opts.headers["Authorization"]).toBe("Bearer bearer_tok");
  });

  it("après logout, les appels API n'ont plus de header Authorization", async () => {
    // Login puis logout
    mockFetchOk({ token: "tok_temp", email: "admin@rw.fr", role: "ADMIN" });
    await login("admin@rw.fr", "pass");
    logout();

    // Appel API après logout
    const { fetchDashboard } = await import("../../services/api");
    mockFetchOk({ total: 0 });
    await fetchDashboard();

    const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const [, opts] = lastCall;
    expect(opts.headers["Authorization"]).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Intégration — Session expirée (401)", () => {
  it("un 401 depuis l'API vide le localStorage et redirige vers /", async () => {
    // Simuler une session existante
    localStorage.setItem("token", "expired_jwt");
    localStorage.setItem("user", JSON.stringify({ email: "user@rw.fr" }));

    // La prochaine requête retourne 401
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve("Unauthorized"),
    });

    const { fetchDashboard } = await import("../../services/api");
    try {
      await fetchDashboard();
    } catch (_) {}

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(window.location.href).toBe("/");
  });
});
