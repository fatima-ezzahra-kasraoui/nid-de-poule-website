// __tests__/components/HistoryModal.test.jsx
// Tests unitaires du composant HistoryModal
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HistoryModal from "../../components/HistoryModal";

// ─── Mock du service API ───────────────────────────────────────────────────
vi.mock("../../services/api", () => ({
  getReportHistory: vi.fn(),
}));
import { getReportHistory } from "../../services/api";

// ─── Données de test ──────────────────────────────────────────────────────
const fakeReport = { id: 42, address: "12 Rue de la Paix, Paris" };

const fakeHistory = [
  {
    id: 1,
    timestamp: "2024-05-01T10:00:00Z",
    oldValue: "pending",
    newValue: "confirmed",
    userEmail: "admin@rw.fr",
  },
  {
    id: 2,
    timestamp: "2024-05-05T14:30:00Z",
    oldValue: "confirmed",
    newValue: "fixed",
    userEmail: "tech@rw.fr",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
describe("HistoryModal — affichage", () => {
  beforeEach(() => {
    getReportHistory.mockResolvedValue(fakeHistory);
  });

  it("ne rend rien si report est null", () => {
    const { container } = render(<HistoryModal report={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("appelle getReportHistory avec l'id du signalement", async () => {
    render(<HistoryModal report={fakeReport} onClose={vi.fn()} />);
    await waitFor(() => expect(getReportHistory).toHaveBeenCalledWith(42));
  });

  it("affiche l'adresse du signalement dans le header", async () => {
    render(<HistoryModal report={fakeReport} onClose={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByText(/12 Rue de la Paix/)).toBeInTheDocument()
    );
  });

  it("affiche les entrées d'historique après chargement", async () => {
    render(<HistoryModal report={fakeReport} onClose={vi.fn()} />);
    await waitFor(() => {
      // Les labels de statut doivent être présents
      expect(screen.getAllByText("Confirmé").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Réparé").length).toBeGreaterThan(0);
    });
  });

  it("affiche le nom des auteurs des changements", async () => {
    render(<HistoryModal report={fakeReport} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("admin@rw.fr")).toBeInTheDocument();
      expect(screen.getByText("tech@rw.fr")).toBeInTheDocument();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("HistoryModal — interactions", () => {
  beforeEach(() => {
    getReportHistory.mockResolvedValue(fakeHistory);
  });

  it("appelle onClose quand on clique sur le bouton fermer", async () => {
    const onClose = vi.fn();
    render(<HistoryModal report={fakeReport} onClose={onClose} />);

    await waitFor(() => screen.getAllByText("Confirmé"));

    // Chercher le bouton de fermeture (le premier bouton dans le header)
    const closeButtons = screen.getAllByRole("button");
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("appelle onClose quand on clique sur l'overlay (fond sombre)", async () => {
    const onClose = vi.fn();
    const { container } = render(<HistoryModal report={fakeReport} onClose={onClose} />);

    await waitFor(() => screen.getAllByText("Confirmé"));

    // Clic sur l'overlay (premier enfant = div position:fixed)
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("HistoryModal — état de chargement", () => {
  it("affiche un état de chargement pendant que l'API répond", () => {
    // Ne jamais résoudre la promesse = état loading infini
    getReportHistory.mockReturnValue(new Promise(() => {}));

    render(<HistoryModal report={fakeReport} onClose={vi.fn()} />);
    // Le modal est rendu (on voit l'en-tête)
    expect(screen.getByText("Historique du signalement")).toBeInTheDocument();
  });

  it("affiche un message si l'historique est vide", async () => {
    getReportHistory.mockResolvedValue([]);
    render(<HistoryModal report={fakeReport} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune action enregistrée")).toBeInTheDocument();
    });
  });
});
