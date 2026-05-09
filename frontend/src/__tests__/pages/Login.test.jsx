// __tests__/pages/Login.test.jsx
// Tests unitaires de la page Login
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../../pages/Login";

// ─── Mock du service auth ────────────────────────────────────────────────
vi.mock("../../services/auth", () => ({
  login: vi.fn(),
}));
import { login } from "../../services/auth";

// ═════════════════════════════════════════════════════════════════════════════
describe("Login — rendu initial", () => {
  it("affiche le titre ROADWATCH", () => {
    render(<Login onLogin={vi.fn()} />);
    expect(screen.getByText("ROADWATCH")).toBeInTheDocument();
  });

  it("affiche le champ email", () => {
    render(<Login onLogin={vi.fn()} />);
    expect(screen.getByPlaceholderText(/roadwatch/i)).toBeInTheDocument();
  });

  it("affiche le champ mot de passe", () => {
    render(<Login onLogin={vi.fn()} />);
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("affiche le bouton de connexion", () => {
    render(<Login onLogin={vi.fn()} />);
    expect(screen.getByText("Accéder au tableau de bord")).toBeInTheDocument();
  });

  it("n'affiche pas de message d'erreur par défaut", () => {
    render(<Login onLogin={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Login — saisie utilisateur", () => {
  it("met à jour la valeur du champ email quand on tape", () => {
    render(<Login onLogin={vi.fn()} />);
    const emailInput = screen.getByPlaceholderText(/roadwatch/i);
    fireEvent.change(emailInput, { target: { value: "admin@test.fr" } });
    expect(emailInput.value).toBe("admin@test.fr");
  });

  it("met à jour la valeur du champ mot de passe quand on tape", () => {
    render(<Login onLogin={vi.fn()} />);
    const pwdInput = screen.getByPlaceholderText("••••••••");
    fireEvent.change(pwdInput, { target: { value: "secret" } });
    expect(pwdInput.value).toBe("secret");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Login — soumission réussie", () => {
  beforeEach(() => {
    login.mockResolvedValue({ token: "jwt_ok", email: "admin@rw.fr", role: "ADMIN" });
  });

  it("appelle login() avec l'email et le mot de passe saisis", async () => {
    render(<Login onLogin={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/roadwatch/i), {
      target: { value: "admin@rw.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Accéder au tableau de bord"));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("admin@rw.fr", "password123")
    );
  });

  it("appelle onLogin() après un login réussi", async () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    fireEvent.change(screen.getByPlaceholderText(/roadwatch/i), {
      target: { value: "admin@rw.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Accéder au tableau de bord"));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
  });

  it("affiche 'Connexion en cours...' pendant le traitement", async () => {
    // Login lent = promesse jamais résolue
    login.mockReturnValue(new Promise(() => {}));

    render(<Login onLogin={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/roadwatch/i), {
      target: { value: "a@a.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByText("Accéder au tableau de bord"));

    expect(await screen.findByText("Connexion en cours...")).toBeInTheDocument();
  });

  it("désactive le bouton pendant le traitement", async () => {
    login.mockReturnValue(new Promise(() => {}));

    render(<Login onLogin={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/roadwatch/i), {
      target: { value: "a@a.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByText("Accéder au tableau de bord"));

    const btn = await screen.findByText("Connexion en cours...");
    expect(btn.closest("button")).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("Login — échec de connexion", () => {
  it("affiche le message d'erreur retourné par le service", async () => {
    login.mockRejectedValue(new Error("Identifiants invalides"));

    render(<Login onLogin={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/roadwatch/i), {
      target: { value: "bad@rw.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByText("Accéder au tableau de bord"));

    expect(await screen.findByText("Identifiants invalides")).toBeInTheDocument();
  });

  it("réaffiche le bouton normal après l'échec", async () => {
    login.mockRejectedValue(new Error("Erreur"));

    render(<Login onLogin={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/roadwatch/i), {
      target: { value: "a@a.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByText("Accéder au tableau de bord"));

    await waitFor(() =>
      expect(screen.getByText("Accéder au tableau de bord")).not.toBeDisabled()
    );
  });

  it("n'appelle pas onLogin() en cas d'échec", async () => {
    const onLogin = vi.fn();
    login.mockRejectedValue(new Error("Erreur"));

    render(<Login onLogin={onLogin} />);
    fireEvent.change(screen.getByPlaceholderText(/roadwatch/i), {
      target: { value: "a@a.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByText("Accéder au tableau de bord"));

    await waitFor(() => screen.getByText("Erreur"));
    expect(onLogin).not.toHaveBeenCalled();
  });
});
