// __tests__/services/auth.test.js
// Tests unitaires du service d'authentification
import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, logout, getToken, getUser, isAuthenticated } from "../../services/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────
function mockFetchOk(body) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(body) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve(body),
  });
}

// ═════════════════════════════════════════════════════════════════════════════
describe("auth.js — getToken / getUser / isAuthenticated", () => {
  it("getToken() retourne null si aucun token stocké", () => {
    expect(getToken()).toBeNull();
  });

  it("getToken() retourne le token présent dans localStorage", () => {
    localStorage.setItem("token", "abc123");
    expect(getToken()).toBe("abc123");
  });

  it("getUser() retourne null si aucun user stocké", () => {
    expect(getUser()).toBeNull();
  });

  it("getUser() parse correctement le JSON du user", () => {
    const user = { email: "admin@test.fr", role: "ADMIN" };
    localStorage.setItem("user", JSON.stringify(user));
    expect(getUser()).toEqual(user);
  });

  it("isAuthenticated() retourne false sans token", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("isAuthenticated() retourne true avec un token", () => {
    localStorage.setItem("token", "token_valide");
    expect(isAuthenticated()).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("auth.js — login()", () => {
  it("stocke le token et le user après un login réussi", async () => {
    const fakeResp = { token: "jwt_abc", email: "admin@rw.fr", role: "ADMIN" };
    mockFetchOk(fakeResp);

    await login("admin@rw.fr", "password123");

    expect(localStorage.getItem("token")).toBe("jwt_abc");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    expect(storedUser.email).toBe("admin@rw.fr");
    expect(storedUser.role).toBe("ADMIN");
  });

  it("appelle le bon endpoint POST /api/auth/login", async () => {
    const fakeResp = { token: "jwt_abc", email: "admin@rw.fr", role: "ADMIN" };
    mockFetchOk(fakeResp);

    await login("admin@rw.fr", "secret");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("envoie les credentials dans le body JSON", async () => {
    const fakeResp = { token: "t", email: "u@u.fr", role: "ADMIN" };
    mockFetchOk(fakeResp);

    await login("u@u.fr", "pass");

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toEqual({ email: "u@u.fr", password: "pass" });
  });

  it("lève une erreur si la réponse n'est pas ok", async () => {
    mockFetchError({ error: "Identifiants invalides" });

    await expect(login("bad@rw.fr", "wrong")).rejects.toThrow("Identifiants invalides");
  });

  it("ne stocke rien en localStorage si le login échoue", async () => {
    mockFetchError({ error: "Erreur" });

    try { await login("bad@rw.fr", "wrong"); } catch (_) {}

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("auth.js — logout()", () => {
  it("supprime le token et le user du localStorage", () => {
    localStorage.setItem("token", "tok");
    localStorage.setItem("user", JSON.stringify({ email: "a@b.fr" }));

    logout();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("ne lève pas d'erreur si on se déconnecte sans être connecté", () => {
    expect(() => logout()).not.toThrow();
  });
});
