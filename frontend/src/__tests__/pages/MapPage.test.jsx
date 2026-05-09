import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MapPage from "../../pages/MapPage";

// Mock Leaflet et ses dépendances (pas de DOM réel dans JSDOM)
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ flyTo: vi.fn(), fitBounds: vi.fn(), flyToBounds: vi.fn() }),
}));

vi.mock("react-leaflet-cluster", () => ({
  default: ({ children }) => <div data-testid="cluster-group">{children}</div>,
}));

vi.mock("leaflet", () => ({
  default: { divIcon: vi.fn(() => ({})) },
  divIcon: vi.fn(() => ({})),
}));

vi.mock("../../services/api", () => ({
  fetchReports: vi.fn(),
  updateStatus: vi.fn(),
}));

import { fetchReports, updateStatus } from "../../services/api";

const mockReports = [
  {
    id: "1",
    address: "Rue Hassan II, Marrakech",
    status: "pending",
    latitude: 31.63,
    longitude: -7.99,
    userEmail: "test@gmail.com",
    timestamp: Date.now() - 86400000,
    aiDetected: true,
    aiConfidence: 0.9,
    photoUrl: null,
  },
  {
    id: "2",
    address: "Avenue Mohammed V, Marrakech",
    status: "confirmed",
    latitude: 31.62,
    longitude: -7.98,
    userEmail: "user2@gmail.com",
    timestamp: Date.now() - 172800000,
    aiDetected: false,
    aiConfidence: 0,
    photoUrl: null,
  },
];

const renderMapPage = (initialEntries = ["/"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="*" element={<MapPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("MapPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchReports.mockResolvedValue(mockReports);
    updateStatus.mockResolvedValue({});
  });

  it("affiche le titre après chargement", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByText("Carte des signalements")).toBeInTheDocument();
    });
  });

  it("affiche le nombre de signalements", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByText(/2 signalement\(s\) localisé\(s\)/i)).toBeInTheDocument();
    });
  });

  it("affiche le container de la carte", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByTestId("map-container")).toBeInTheDocument();
    });
  });

  it("affiche les markers pour chaque signalement", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getAllByTestId("marker")).toHaveLength(2);
    });
  });

  it("affiche la légende des statuts", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByText("En attente")).toBeInTheDocument();
      expect(screen.getByText("Confirmé")).toBeInTheDocument();
      expect(screen.getByText("Réparé")).toBeInTheDocument();
    });
  });

  it("affiche le bouton Vue globale", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByText(/vue globale/i)).toBeInTheDocument();
    });
  });

  it("affiche les adresses dans les popups", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByText("Rue Hassan II, Marrakech")).toBeInTheDocument();
      expect(screen.getByText("Avenue Mohammed V, Marrakech")).toBeInTheDocument();
    });
  });

  it("affiche les boutons de changement de statut dans les popups", async () => {
    renderMapPage();
    await waitFor(() => {
      expect(screen.getAllByText("Confirmer").length).toBeGreaterThan(0);
    });
  });



  it("affiche une erreur si fetchReports échoue", async () => {
    fetchReports.mockRejectedValue(new Error("Réseau indisponible"));
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByText(/réseau indisponible/i)).toBeInTheDocument();
    });
  });

  it("affiche 0 signalement si liste vide", async () => {
    fetchReports.mockResolvedValue([]);
    renderMapPage();
    await waitFor(() => {
      expect(screen.getByText(/0 signalement\(s\) localisé\(s\)/i)).toBeInTheDocument();
    });
  });


});