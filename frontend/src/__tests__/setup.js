// setup.js — Configuration globale pour tous les tests
import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── Mock localStorage ──────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (key) => store[key] ?? null,
    setItem:    (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear:      () => { store = {}; },
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// ── Mock window.location ────────────────────────────────────────────────────
delete window.location;
window.location = { href: "/" };

// ── Mock fetch global ─────────────────────────────────────────────────────
global.fetch = vi.fn();

// ── Mock EventSource ──────────────────────────────────────────────────────
global.EventSource = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onerror: null,
}));

// ── Nettoyer les mocks entre chaque test ──────────────────────────────────
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
