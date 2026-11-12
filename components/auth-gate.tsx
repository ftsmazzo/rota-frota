"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  LoaderCircle,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
} from "lucide-react";
import type { AppUser } from "../lib/auth-types";
import { configureOffline } from "../lib/offline";
import FleetApp from "./fleet-app";
import { PwaInstallHint } from "./pwa-install-hint";

export default function AuthGate() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 503) throw Error("Conexão indisponível");
      if (data.user) {
        await configureOffline(data.user.id);
        setUser(data.user);
        localStorage.setItem(
          "rota-offline-profile",
          JSON.stringify({ user: data.user, expires: Date.now() + 7 * 86400000 })
        );
      } else {
        setUser(null);
        localStorage.removeItem("rota-offline-profile");
      }
    } catch {
      if (!navigator.onLine) {
        try {
          const cached = JSON.parse(localStorage.getItem("rota-offline-profile") || "null");
          if (cached?.user && cached.expires > Date.now()) {
            await configureOffline(cached.user.id);
            setUser(cached.user);
          }
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    window.addEventListener("online", refresh);
    return () => window.removeEventListener("online", refresh);
  }, []);

  async function logout() {
    if (!navigator.onLine) {
      alert("Conecte-se para encerrar a sessão com segurança.");
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("rota-offline-profile");
    setUser(null);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="brand-mark">r</span>
        <LoaderCircle className="spin" size={22} />
        <span>Preparando seu acesso…</span>
      </div>
    );
  }

  if (!user) return <AccessForm onDone={refresh} />;
  if (user.mustChangePassword) {
    return <AccessForm changePassword onDone={refresh} onLogout={logout} />;
  }

  return <FleetApp user={user} onLogout={logout} />;
}

export function AccessForm({
  changePassword = false,
  onDone,
  onLogout,
}: {
  changePassword?: boolean;
  onDone: () => Promise<void>;
  onLogout?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div className="login-page">
      <section className="login-art">
        <header className="login-art-header">
          <a className="brand" href="/" aria-label="Rota Frota">
            <span className="brand-mark">r</span>
            <span>rota.</span>
          </a>
          <span className="login-art-tag">FROTA INTERNA · SST</span>
        </header>

        <div className="login-art-body">
          <h1 className="login-art-title">Sua frota, em boas mãos.</h1>
          <p className="login-art-desc">
            Da saída ao retorno, uma rotina mais simples e um histórico mais claro.
          </p>

          <div className="login-road-wrap" aria-hidden="true">
            <div className="login-road-stage">
              <svg
                className="login-road-svg"
                viewBox="-10 0 420 170"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <path
                  d="M-10 150 C 50 150, 70 70, 140 78 S 230 140, 330 30 S 380 10, 400 8"
                  stroke="#ffffff"
                  strokeWidth="28"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.14"
                />
                <path
                  className="live-road-dashed"
                  d="M-10 150 C 50 150, 70 70, 140 78 S 230 140, 330 30 S 380 10, 400 8"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeDasharray="8 7"
                  strokeLinecap="round"
                />
                <circle cx="16" cy="150" r="12" fill="var(--accent)" fillOpacity="0.2" />
                <circle cx="16" cy="150" r="3.5" fill="var(--accent)" />
              </svg>

              <div className="login-road-dot" />
            </div>
          </div>

          <div className="login-art-badge">
            <ShieldCheck size={20} />
            <span>Veículos, pessoas e registros no mesmo lugar.</span>
          </div>
        </div>

        <footer className="login-art-footer">
          <small>CONTROLE DE FROTA INTERNA</small>
        </footer>
      </section>

      <section className="login-content">
        <div className="login-form-card">
          <div className="login-form-header">
            <span className="login-lock">
              <LockKeyhole size={22} />
            </span>
            <span className="eyebrow">
              {changePassword ? "PRIMEIRO ACESSO" : "BEM-VINDO AO ROTA"}
            </span>
            <h2>{changePassword ? "Defina sua nova senha." : "Sua operação começa aqui."}</h2>
            <p>
              {changePassword
                ? "Troque a senha inicial por uma senha pessoal com pelo menos 12 caracteres."
                : "Entre com seu e-mail e senha para acompanhar a frota."}
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const values = Object.fromEntries(new FormData(e.currentTarget));
              if (changePassword && values.newPassword !== values.confirmPassword) {
                setError("A confirmação da nova senha não corresponde.");
                setBusy(false);
                return;
              }
              try {
                const response = await fetch(
                  changePassword ? "/api/auth/password" : "/api/auth/login",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                  }
                );
                const data = await response.json();
                if (!response.ok) throw Error(data.error || "Não foi possível continuar.");
                await onDone();
              } catch (err) {
                setError((err as Error).message);
              }
              setBusy(false);
            }}
          >
            {!changePassword && (
              <label className="field">
                <span>E-mail</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="seu@email.com"
                />
              </label>
            )}

            <label className="field">
              <span>{changePassword ? "Senha atual / inicial" : "Senha"}</span>
              <div className="password-field">
                <input
                  name={changePassword ? "currentPassword" : "password"}
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                />
                <button
                  className="icon-button"
                  type="button"
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {changePassword && (
              <>
                <label className="field">
                  <span>Nova senha</span>
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={200}
                    required
                    placeholder="Mínimo 12 caracteres"
                  />
                </label>
                <label className="field">
                  <span>Confirme a nova senha</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={200}
                    required
                    placeholder="Repita a nova senha"
                  />
                </label>
              </>
            )}

            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="button primary login-submit"
              disabled={busy}
            >
              {busy ? <LoaderCircle size={18} className="spin" /> : <ArrowRight size={18} />}
              <span>{changePassword ? "Salvar nova senha" : "Entrar"}</span>
            </button>

            {onLogout && (
              <button type="button" className="text-button login-back-btn" onClick={onLogout}>
                <LogOut size={14} /> Voltar ao login
              </button>
            )}
          </form>

          <PwaInstallHint />

          <small className="login-help">
            {changePassword
              ? "A senha inicial deixa de funcionar após esta alteração."
              : "O acesso é liberado pelo administrador da sua empresa."}
          </small>
        </div>
      </section>
    </div>
  );
}
