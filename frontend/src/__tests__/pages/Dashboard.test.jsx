import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../../pages/Dashboard";

// Mock des services
vi.mock("../../services/api", () => ({
  fetchDashboard: vi.fn(),
  fetchReports: vi.fn(),
  getLikes: vi.fn(),
}));

// Mock NotificationBell
vi.mock("../../components/NotificationBell", () => ({
  default: () => <div data-testid="notification-bell" />,
}));

// Mock fetch global (pour météo)
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ score: 0, condition: "Sec", description: "Temps sec" }),
  })
);

import { fetchDashboard, fetchReports, getLikes } from "../../services/api";

const mockStats = {
  total: 10,
  pending: 4,
  confirmed: 3,
  fixed: 3,
  avgRepair: 5,
};

const mockReports = [
  {
    id: "1",
    address: "Rue Hassan II, Marrakech, Maroc",
    status: "pending",
    aiDetected: true,
    aiConfidence: 0.87,
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    latitude: 31.63,
    longitude: -7.99,
    userEmail: "test@gmail.com",
    formattedDate: "07/05/2026",
  },
  {
    id: "2",
    address: "Avenue Mohammed V, Marrakech",
    status: "confirmed",
    aiDetected: false,
    aiConfidence: 0,
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    latitude: 31.62,
    longitude: -7.98,
    userEmail: "user2@gmail.com",
    formattedDate: "06/05/2026",
  },
];

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDashboard.mockResolvedValue(mockStats);
    fetchReports.mockResolvedValue(mockReports);
    getLikes.mockResolvedValue({ likeCount: 2, likedBy: [] });
    localStorage.setItem("user", JSON.stringify({ email: "admin@roadwatch.com" }));
  });

  it("affiche le spinner de chargement au départ", () => {
    fetchDashboard.mockReturnValue(new Promise(() => {}));
    fetchReports.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/chargement des données/i)).toBeInTheDocument();
  });

  it("affiche le titre Tableau de bord après chargement", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
    });
  });

  it("affiche les KPIs corrects", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument(); // total
      expect(screen.getByText("4")).toBeInTheDocument();  // pending
      expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);  // confirmed ou fixed
    });
  });

  it("affiche le taux de résolution", async () => {
  renderDashboard();
  await waitFor(() => {
    const elements = screen.getAllByText(/30%/);
    expect(elements.length).toBeGreaterThan(0);
  });
});
  it("affiche le temps moyen de réparation", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/5 j/i)).toBeInTheDocument();
    });
  });

  it("affiche la section signalements prioritaires", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/signalements prioritaires/i)).toBeInTheDocument();
    });
  });

  it("affiche la section zones les plus touchées", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/zones les plus touchées/i)).toBeInTheDocument();
    });
  });

  it("affiche le lien vers la carte", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/visualisation cartographique/i)).toBeInTheDocument();
    });
  });

  it("affiche l'email de l'utilisateur connecté", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("admin@roadwatch.com")).toBeInTheDocument();
    });
  });

  it("affiche le bouton Actualiser", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Actualiser")).toBeInTheDocument();
    });
  });

  it("affiche 'Erreur de chargement' si fetchDashboard retourne null", async () => {
    fetchDashboard.mockResolvedValue(null);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/erreur de chargement/i)).toBeInTheDocument();
    });
  });

  it("affiche 'Aucun signalement prioritaire' si liste vide", async () => {
    fetchReports.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/aucun signalement prioritaire/i)).toBeInTheDocument();
    });
  });

  it("affiche 'Aucune donnée disponible' pour les zones si pas de signalements", async () => {
    fetchReports.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/aucune donnée disponible/i)).toBeInTheDocument();
    });
  });

  it("affiche la NotificationBell", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
    });
  });
});