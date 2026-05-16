import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Reports from "../../pages/Reports";

// Mock des services
vi.mock("../../services/api", () => ({
  fetchReports: vi.fn(),
  updateStatus: vi.fn(),
  downloadExport: vi.fn(),
  deleteReport: vi.fn(),
  getReportHistory: vi.fn(),
  getLikes: vi.fn(),
}));

// Mock HistoryModal
vi.mock("../../components/HistoryModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="history-modal">
      <button onClick={onClose}>Fermer historique</button>
    </div>
  ),
}));

import {
  fetchReports,
  updateStatus,
  downloadExport,
  deleteReport,
  getLikes,
} from "../../services/api";

const mockReports = [
  {
    id: "1",
    address: "Rue Hassan II, Marrakech",
    userEmail: "user1@gmail.com",
    status: "pending",
    aiDetected: true,
    aiConfidence: 0.87,
    latitude: 31.63,
    longitude: -7.99,
    formattedDate: "07/05/2026",
    photoUrl: "http://example.com/photo1.jpg",
    description: "Grand nid de poule",
  },
  {
    id: "2",
    address: "Avenue Mohammed V",
    userEmail: "user2@gmail.com",
    status: "fixed",
    aiDetected: false,
    aiConfidence: 0,
    latitude: 31.62,
    longitude: -7.98,
    formattedDate: "06/05/2026",
    photoUrl: null,
    description: null,
  },
];

const renderReports = () =>
  render(
    <MemoryRouter>
      <Reports />
    </MemoryRouter>
  );

describe("Reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchReports.mockResolvedValue(mockReports);
    getLikes.mockResolvedValue({ likeCount: 3, likedBy: [] });
    updateStatus.mockResolvedValue({ success: true });
    deleteReport.mockResolvedValue({ success: true });
    downloadExport.mockResolvedValue();
  });

  it("affiche le spinner de chargement au départ", () => {
    fetchReports.mockReturnValue(new Promise(() => {}));
    renderReports();
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it("affiche le titre Gestion des signalements", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText("Gestion des signalements")).toBeInTheDocument();
    });
  });

  it("affiche le nombre de signalements trouvés", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText(/2 signalement\(s\) trouvé\(s\)/i)).toBeInTheDocument();
    });
  });

  it("affiche les boutons d'export", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText(/exporter excel/i)).toBeInTheDocument();
      expect(screen.getByText(/exporter pdf/i)).toBeInTheDocument();
    });
  });

  it("appelle downloadExport quand on clique sur Exporter Excel", async () => {
    renderReports();
    await waitFor(() => screen.getByText(/exporter excel/i));
    fireEvent.click(screen.getByText(/exporter excel/i));
    expect(downloadExport).toHaveBeenCalledWith("excel", "all");
  });

  it("appelle downloadExport quand on clique sur Exporter PDF", async () => {
    renderReports();
    await waitFor(() => screen.getByText(/exporter pdf/i));
    fireEvent.click(screen.getByText(/exporter pdf/i));
    expect(downloadExport).toHaveBeenCalledWith("pdf", "all");
  });

  it("affiche les filtres", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText(/filtres/i)).toBeInTheDocument();
      expect(screen.getByText("Statut")).toBeInTheDocument();
      expect(screen.getByText("Du")).toBeInTheDocument();
      expect(screen.getByText("Au")).toBeInTheDocument();
    });
  });

  it("affiche les colonnes du tableau", async () => {
  renderReports();
  await waitFor(() => {
    expect(screen.getByText("Photo")).toBeInTheDocument();
    expect(screen.getByText("Adresse")).toBeInTheDocument();
    expect(screen.getByText("Utilisateur")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });
});

  it("affiche les signalements dans le tableau", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText("Rue Hassan II, Marrakech")).toBeInTheDocument();
      expect(screen.getByText("user1@gmail.com")).toBeInTheDocument();
      expect(screen.getByText("Avenue Mohammed V")).toBeInTheDocument();
    });
  });

  it("affiche 'Non détecté' pour un signalement sans IA", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText("Non détecté")).toBeInTheDocument();
    });
  });

  it("affiche 'Détecté' et le pourcentage de confiance pour IA", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText("Détecté")).toBeInTheDocument();
      expect(screen.getByText(/87% confiance/i)).toBeInTheDocument();
    });
  });

  it("affiche 'Aucun signalement trouvé' si liste vide", async () => {
    fetchReports.mockResolvedValue([]);
    renderReports();
    await waitFor(() => {
      expect(screen.getByText(/aucun signalement trouvé/i)).toBeInTheDocument();
    });
  });

  it("affiche un message d'erreur si fetchReports échoue", async () => {
    fetchReports.mockRejectedValue(new Error("Erreur réseau"));
    renderReports();
    await waitFor(() => {
      expect(screen.getByText(/erreur réseau/i)).toBeInTheDocument();
    });
  });

  it("ouvre le modal de suppression quand on clique sur supprimer", async () => {
    renderReports();
    await waitFor(() => screen.getByText("Rue Hassan II, Marrakech"));
    const deleteButtons = screen.getAllByTitle("Supprimer le signalement");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/confirmer la suppression/i)).toBeInTheDocument();
    });
  });

  it("ferme le modal de suppression en cliquant Annuler", async () => {
    renderReports();
    await waitFor(() => screen.getByText("Rue Hassan II, Marrakech"));
    const deleteButtons = screen.getAllByTitle("Supprimer le signalement");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => screen.getByText(/confirmer la suppression/i));
    fireEvent.click(screen.getByText("Annuler"));
    await waitFor(() => {
      expect(screen.queryByText(/confirmer la suppression/i)).not.toBeInTheDocument();
    });
  });

  it("appelle deleteReport et retire le signalement de la liste", async () => {
    renderReports();
    await waitFor(() => screen.getByText("Rue Hassan II, Marrakech"));
    const deleteButtons = screen.getAllByTitle("Supprimer le signalement");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => screen.getByText(/confirmer la suppression/i));
    fireEvent.click(screen.getByText("Supprimer"));
    await waitFor(() => {
      expect(deleteReport).toHaveBeenCalledWith("1");
    });
  });

  it("ouvre le modal historique quand on clique sur l'icône historique", async () => {
    renderReports();
    await waitFor(() => screen.getByText("Rue Hassan II, Marrakech"));
    const historyButtons = screen.getAllByTitle("Voir l'historique");
    fireEvent.click(historyButtons[0]);
    await waitFor(() => {
      expect(screen.getByTestId("history-modal")).toBeInTheDocument();
    });
  });

  it("ferme le modal historique", async () => {
    renderReports();
    await waitFor(() => screen.getByText("Rue Hassan II, Marrakech"));
    const historyButtons = screen.getAllByTitle("Voir l'historique");
    fireEvent.click(historyButtons[0]);
    await waitFor(() => screen.getByTestId("history-modal"));
    fireEvent.click(screen.getByText("Fermer historique"));
    await waitFor(() => {
      expect(screen.queryByTestId("history-modal")).not.toBeInTheDocument();
    });
  });

  it("ouvre le modal détail quand on clique sur une ligne", async () => {
    renderReports();
    await waitFor(() => screen.getByText("Rue Hassan II, Marrakech"));
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1]); // première ligne de données
    await waitFor(() => {
      expect(screen.getByText(/détail du signalement/i)).toBeInTheDocument();
    });
  });

  it("affiche le bouton Filtrer", async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText("Filtrer")).toBeInTheDocument();
    });
  });

  it("appelle fetchReports avec les bons paramètres au clic Filtrer", async () => {
    renderReports();
    await waitFor(() => screen.getByText("Filtrer"));
    fireEvent.click(screen.getByText("Filtrer"));
    await waitFor(() => {
      expect(fetchReports).toHaveBeenCalledTimes(2);
    });
  });
});