"use client";
import React, { useState } from "react";
import {
  Sparkles,
  Info,
  WifiOff,
  ArrowUpRight,
  Check,
  Send,
  X,
  Shield,
} from "lucide-react";
import { getVehicleState, type FleetData, type Draft } from "../lib/model";

export function Assistant({
  data,
  draft,
  configured,
  online,
  onApply,
  onClose,
}: {
  data: FleetData;
  draft?: Draft;
  configured: boolean;
  online: boolean;
  onApply: (s: any) => void;
  onClose: () => void;
}) {
  const [message, setMessage] = useState(draft?.notes || "");
  const [messages, setMessages] = useState<{ role: string; text: string; suggestion?: any }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(text = message) {
    if (!text.trim() || busy) return;
    setMessage("");
    setError("");
    setMessages((old) => [...old, { role: "user", text }]);
    setBusy(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: draft
            ? {
                vehicle: data.vehicles.find((v) => v.id === draft.vehicleId),
                draft: {
                  odometer: draft.odometer,
                  fuel: draft.fuel,
                  destination: draft.destination,
                  notes: draft.notes,
                  findings: draft.findings,
                },
              }
            : {
                vehicles: data.vehicles.map((v) => ({
                  ...v,
                  state: getVehicleState(v, data.inspections),
                })),
                inspections: data.inspections.map(
                  ({ photos, driverSignature, inspectorSignature, audio, ...i }) => i
                ),
              },
        }),
      });
      const result = (await response.json()) as any;
      if (!response.ok) throw new Error(result.error);
      setMessages((old) => [...old, { role: "assistant", text: result.text, suggestion: result }]);
    } catch (e) {
      setError((e as Error).message || "Não foi possível consultar o assistente.");
    }
    setBusy(false);
  }

  const defaultPrompts = draft
    ? [
        "Organize minha observação em apontamentos.",
        "O que ainda preciso conferir nesta vistoria?",
      ]
    : [
        "Resuma os apontamentos que precisam de atenção.",
        "Quais veículos estão disponíveis para uma saída?",
        "Quais carros estão na rua agora?",
        "Qual veículo tem maior quilometragem?",
      ];

  const canSend = configured && online && !busy && Boolean(message.trim());

  return (
    <div className="assistant-overlay">
      <button
        type="button"
        className="assistant-backdrop"
        aria-label="Fechar assistente"
        onClick={onClose}
      />
      <aside
        className="assistant-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Copiloto Rota"
      >
        <header className="assistant-header">
          <div className="assistant-header-brand">
            <div className="assistant-header-icon-wrap">
              <div className="assistant-icon-halo" />
              <div className="assistant-icon-box">
                <Sparkles size={20} />
              </div>
            </div>
            <div className="assistant-header-text">
              <strong className="assistant-header-title">Copiloto Rota</strong>
              <small className="assistant-header-sub">Pergunte sobre a sua frota</small>
            </div>
          </div>
          <button
            type="button"
            className="assistant-close-btn"
            onClick={onClose}
            aria-label="Fechar assistente"
          >
            <X size={20} />
          </button>
        </header>

        <div className="assistant-body">
          {!configured && (
            <div className="info-box">
              <Info size={17} />
              <span>A conexão de IA ainda não foi ativada. As vistorias continuam disponíveis.</span>
            </div>
          )}
          {!online && (
            <div className="info-box">
              <WifiOff size={17} />
              <span>A IA precisa de conexão. Continue a vistoria e consulte o assistente ao retornar.</span>
            </div>
          )}

          {!messages.length && (
            <div className="assistant-welcome">
              <div className="assistant-welcome-icon">
                <Sparkles size={26} />
              </div>
              <h2>
                Mais clareza.
                <br />
                Menos trabalho manual.
              </h2>
              <p>
                {draft
                  ? "Descreva o que observou no veículo. Eu organizo a informação para você conferir."
                  : "Pergunte sobre os registros disponíveis ou peça um resumo dos apontamentos da frota."}
              </p>
            </div>
          )}

          {!messages.length && (
            <div className="suggested-prompts">
              {defaultPrompts.map((s, idx) => (
                <button
                  key={s}
                  type="button"
                  className="prompt-chip rise"
                  style={{ animationDelay: `${idx * 60}ms` }}
                  disabled={!configured || !online}
                  onClick={() => send(s)}
                >
                  <span>{s}</span>
                  <ArrowUpRight size={15} className="prompt-arrow" />
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role} rise`}>
              {m.role === "assistant" && (
                <span className="message-author">
                  <span className="copilot-mini-badge">
                    <Sparkles size={11} />
                  </span>
                  <span>Copiloto Rota</span>
                </span>
              )}
              <p>{m.text}</p>
              {draft &&
                m.suggestion &&
                (m.suggestion.odometer !== null ||
                  m.suggestion.fuel !== null ||
                  m.suggestion.destination ||
                  m.suggestion.findings?.length > 0) && (
                  <button
                    type="button"
                    className="button secondary small assistant-apply-btn"
                    onClick={() => onApply(m.suggestion)}
                  >
                    Aplicar sugestões ao rascunho <Check size={14} />
                  </button>
                )}
            </div>
          ))}

          {busy && (
            <div className="assistant-typing" aria-live="polite">
              <div className="typing-dots">
                <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                <span className="typing-dot" style={{ animationDelay: "150ms" }} />
                <span className="typing-dot" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="typing-label">Organizando os registros…</span>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </div>

        <div className="assistant-compose">
          <form
            className="assistant-compose-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Escreva sua observação ou pergunta…"
              aria-label="Mensagem para o assistente"
              disabled={!configured || !online}
            />
            <button
              type="submit"
              className={`assistant-send-btn ${canSend ? "ready" : "disabled"}`}
              disabled={!canSend}
              aria-label="Enviar mensagem"
            >
              <Send size={18} />
            </button>
          </form>

          <div className="assistant-disclaimer">
            <Shield size={12} aria-hidden="true" />
            <span>As sugestões de IA precisam da sua conferência.</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
