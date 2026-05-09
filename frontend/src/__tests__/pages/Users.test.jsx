import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Users from "../../pages/Users";

vi.mock("../../services/api", () => ({
  getUsers: vi.fn(),
  getUserStats: vi.fn(),
  disableUser: vi.fn(),
  enableUser: vi.fn(),
  deleteUser: vi.fn(),
}));

import { getUsers, getUserStats, disableUser, enableUser, deleteUser } from "../../services/api";

const mockUsers = [
  {
    uid: "abc123def456ghi7",
    email: "user1@test.com",
    displayName: "Alice",
    disabled: false,
    reportCount: 3,
    creationTimestamp: 1700000000000,
    lastSignInTimestamp: 1710000000000,
  },
  {
    uid: "xyz789uvw012rst3",
    email: "user2@test.com",
    displayName: "Bob",
    disabled: true,
    reportCount: 0,
    creationTimestamp: 1700000000000,
    lastSignInTimestamp: null,
  },
];

const mockStats = {
  total: 2,
  actifs: 1,
  desactives: 1,
  totalSignalements: 3,
};

const renderUsers = () =>
  render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>
  );

describe("Users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUsers.mockResolvedValue(mockUsers);
    getUserStats.mockResolvedValue(mockStats);
    disableUser.mockResolvedValue({});
    enableUser.mockResolvedValue({});
    deleteUser.mockResolvedValue({});
  });

  it("affiche le spinner au chargement", () => {
    getUsers.mockReturnValue(new Promise(() => {}));
    getUserStats.mockReturnValue(new Promise(() => {}));
    renderUsers();
    expect(screen.getByText(/chargement des utilisateurs/i)).toBeInTheDocument();
  });

  it("affiche le titre après chargement", async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText("Utilisateurs mobiles")).toBeInTheDocument();
    });
  });

  it("affiche les KPIs stats", async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText("Total utilisateurs")).toBeInTheDocument();
      expect(screen.getByText("Actifs")).toBeInTheDocument();
      expect(screen.getByText("Désactivés")).toBeInTheDocument();
    });
  });

  it("affiche les utilisateurs dans le tableau", async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText("user1@test.com")).toBeInTheDocument();
      expect(screen.getByText("user2@test.com")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("affiche le statut Actif / Désactivé", async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText("Actif")).toBeInTheDocument();
      expect(screen.getByText("Désactivé")).toBeInTheDocument();
    });
  });

  it("filtre les utilisateurs par email", async () => {
    renderUsers();
    await waitFor(() => expect(screen.getByText("user1@test.com")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), {
      target: { value: "user1" },
    });

    expect(screen.getByText("user1@test.com")).toBeInTheDocument();
    expect(screen.queryByText("user2@test.com")).not.toBeInTheDocument();
  });

  it("affiche 'Aucun utilisateur trouvé' si filtre sans résultat", async () => {
    renderUsers();
    await waitFor(() => expect(screen.getByText("user1@test.com")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), {
      target: { value: "zzznomatch" },
    });

    expect(screen.getByText(/aucun utilisateur trouvé/i)).toBeInTheDocument();
  });

  it("affiche le bouton Désactiver pour un utilisateur actif", async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getAllByText("Désactiver").length).toBeGreaterThan(0);
    });
  });

  it("affiche le bouton Activer pour un utilisateur désactivé", async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText("Activer")).toBeInTheDocument();
    });
  });

  it("appelle disableUser au clic sur Désactiver", async () => {
    renderUsers();
    await waitFor(() => expect(screen.getAllByText("Désactiver").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("Désactiver")[0]);
    await waitFor(() => {
      expect(disableUser).toHaveBeenCalledWith("abc123def456ghi7");
    });
  });

  it("appelle enableUser au clic sur Activer", async () => {
    renderUsers();
    await waitFor(() => expect(screen.getByText("Activer")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Activer"));
    await waitFor(() => {
      expect(enableUser).toHaveBeenCalledWith("xyz789uvw012rst3");
    });
  });

  it("appelle deleteUser après confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderUsers();
    await waitFor(() => expect(screen.getAllByText("Supprimer").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("Supprimer")[0]);
    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith("abc123def456ghi7");
    });
  });

  it("n'appelle pas deleteUser si confirmation annulée", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderUsers();
    await waitFor(() => expect(screen.getAllByText("Supprimer").length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByText("Supprimer")[0]);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("affiche '—' si displayName absent", async () => {
    getUsers.mockResolvedValue([{ ...mockUsers[0], displayName: null }]);
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });
});