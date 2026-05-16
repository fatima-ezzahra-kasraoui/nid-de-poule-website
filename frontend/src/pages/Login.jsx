import React, { useState } from "react";
import { login } from "../services/auth";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">RW</div>
            <h1 className="login-title">ROADWATCH</h1>
          </div>
          <p className="login-subtitle">Portail d'administration</p>
          <div className="login-divider"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Identifiant</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="exemple@roadwatch.fr"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary login-btn">
            {loading ? "Connexion en cours..." : "Accéder au tableau de bord"}
          </button>
        </form>

        <div className="login-footer">
          <div className="login-footer-line"></div>
          <span>Système sécurisé - Accès restreint</span>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            45deg,
            rgba(230, 126, 34, 0.03) 0px,
            rgba(230, 126, 34, 0.03) 2px,
            transparent 2px,
            transparent 8px
          );
          animation: slide 20s linear infinite;
        }

        @keyframes slide {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(-50px) translateY(-50px); }
        }

        .login-card {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 48px 44px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(230, 126, 34, 0.2);
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-logo {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .login-logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #e67e22 0%, #b85e0a 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          color: white;
        }

        .login-title {
          font-size: 28px;
          font-weight: 600;
          color: #1a1a2e;
          letter-spacing: 1px;
        }

        .login-subtitle {
          font-size: 13px;
          color: #6c757d;
          margin-bottom: 20px;
        }

        .login-divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #e67e22, #f39c12);
          margin: 0 auto;
          border-radius: 2px;
        }

        .login-error {
          background: #fee2e2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
          margin-bottom: 20px;
        }

        .login-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          margin-top: 8px;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }

        .login-footer-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e67e22, transparent);
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}

export default Login;