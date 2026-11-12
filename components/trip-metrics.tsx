"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Gauge, ArrowRight } from "lucide-react";
import { Odometer } from "./odometer";
import type { VehicleTrip } from "../lib/trips";
import type { Driver } from "../lib/model";

export interface TripMetricsProps {
  totals: {
    distance: number;
    completed: number;
    active: number;
    incomplete: number;
  };
  trips?: VehicleTrip[];
  drivers?: Driver[];
  onSelectIncomplete?: () => void;
}

const AVATAR_PALETTE = [
  { bg: "#dfe8f3", color: "#2f4f69" },
  { bg: "#f1e3d2", color: "#6b4a22" },
  { bg: "#e2eedb", color: "#325c27" },
  { bg: "#ebdff1", color: "#5c2d73" },
];

function getInitials(name?: string): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TripMetrics({
  totals,
  trips = [],
  drivers = [],
  onSelectIncomplete,
}: TripMetricsProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [totals.distance, totals.completed, totals.active, totals.incomplete]);

  // Mini gráfico de barras (até 6 utilizações encerradas mais recentes)
  const completedTrips = useMemo(() => {
    return trips.filter(
      (t) => t.status === "completed" && typeof t.distance === "number"
    );
  }, [trips]);

  const recentBars = useMemo(() => {
    if (!completedTrips.length) return [];
    // As até 6 mais recentes em ordem cronológica (esquerda -> direita)
    const slice = completedTrips.slice(0, 6).reverse();
    const distances = slice.map((t) => Math.round(t.distance || 0));
    const max = Math.max(...distances, 1);

    return slice.map((t, i) => {
      const v = Math.round(t.distance || 0);
      const isMax = v === max && v > 0;
      return {
        v,
        h: 50,
        s: animated ? Math.max(v / max, 0.08) : 0,
        color: isMax ? "var(--accent-ink)" : "var(--muted)",
        delay: `${0.5 + i * 0.12}s`,
      };
    });
  }, [completedTrips, animated]);

  // Avatares das saídas em aberto
  const activeDrivers = useMemo(() => {
    const activeTrips = trips.filter((t) => t.status === "active");
    const list: Driver[] = [];
    const seen = new Set<string>();
    for (const t of activeTrips) {
      const d = drivers.find((dr) => dr.id === t.driverId);
      if (d && !seen.has(d.id)) {
        seen.add(d.id);
        list.push(d);
      }
    }
    return list;
  }, [trips, drivers]);

  // Anel de progresso de utilizações encerradas
  const totalCompletedAndActive = totals.completed + totals.active;
  const progressRatio =
    totalCompletedAndActive > 0 ? totals.completed / totalCompletedAndActive : 0;
  const ringOffset = animated ? 100.5 * (1 - progressRatio) : 100.5;

  const hasIncomplete = totals.incomplete > 0;

  return (
    <div className="trip-metrics trips-indicator-block">
      {/* 1) Topo */}
      <div className="trip-metrics-header" style={{ padding: "0 6px" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".12em",
            color: "var(--muted)",
            display: "block",
          }}
        >
          RESUMO DO PERÍODO
        </span>
      </div>

      {/* 2) Card largo de Km */}
      <div
        className="card trip-card-km"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 22,
          boxShadow: "var(--shadow)",
          padding: 18,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background: "var(--success-bg)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Gauge size={15} strokeWidth={2.2} />
            </span>
            Km rodados
          </span>
          <div
            className="mono"
            style={{
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "var(--ink)",
              lineHeight: 1,
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <Odometer value={totals.distance} ariaLabel={`${totals.distance} km rodados`} />
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--muted)",
                marginLeft: 6,
                letterSpacing: 0,
              }}
            >
              km
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            em utilizações encerradas
          </span>
        </div>

        {recentBars.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                height: 58,
              }}
            >
              {recentBars.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      lineHeight: 1,
                    }}
                  >
                    {b.v}
                  </span>
                  <div
                    className="bar trip-metrics-bar"
                    style={{
                      width: 18,
                      height: `${b.h}px`,
                      borderRadius: 6,
                      background: b.color,
                      transform: `scaleY(${b.s})`,
                      transformOrigin: "bottom",
                      transition: "transform .9s cubic-bezier(.2,.8,.2,1)",
                      transitionDelay: b.delay,
                    }}
                  />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              por viagem
            </span>
          </div>
        )}
      </div>

      {/* 3) Grid de 2 colunas */}
      <div
        className="trip-metrics-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {/* a) Encerradas */}
        <div
          className="card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 22,
            boxShadow: "var(--shadow)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted)",
              }}
            >
              Encerradas
            </span>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              aria-hidden="true"
              style={{ overflow: "visible" }}
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="var(--track)"
                strokeWidth="5"
              />
              <circle
                className="ring trip-ring"
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="var(--success)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="100.5"
                strokeDashoffset={ringOffset}
                transform="rotate(-90 20 20)"
                style={{
                  transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)",
                }}
              />
            </svg>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "var(--ink)",
              lineHeight: 1,
              display: "flex",
            }}
          >
            <Odometer
              value={totals.completed}
              ariaLabel={`${totals.completed} utilizações encerradas`}
            />
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            <b className="mono" style={{ color: "var(--ink)", fontWeight: 600 }}>
              {totals.completed}
            </b>{" "}
            de{" "}
            <b className="mono" style={{ color: "var(--ink)", fontWeight: 600 }}>
              {totalCompletedAndActive}
            </b>{" "}
            utilizações
          </span>
        </div>

        {/* b) Na rua agora */}
        <div
          className="card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 22,
            boxShadow: "var(--shadow)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted)",
              }}
            >
              Na rua agora
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                fontWeight: 600,
                color: "var(--info)",
              }}
            >
              {totals.active > 0 && (
                <span
                  className="live"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--info)",
                    color: "var(--info)",
                  }}
                />
              )}
              AO VIVO
            </span>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "var(--ink)",
              lineHeight: 1,
              display: "flex",
            }}
          >
            <Odometer
              value={totals.active}
              ariaLabel={`${totals.active} saídas em aberto`}
            />
          </div>
          {totals.active > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex" }}>
                {activeDrivers.slice(0, 4).map((d, idx) => (
                  <span
                    key={d.id || idx}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background:
                        AVATAR_PALETTE[idx % AVATAR_PALETTE.length].bg,
                      color:
                        AVATAR_PALETTE[idx % AVATAR_PALETTE.length].color,
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--surface)",
                      marginLeft: idx > 0 ? -8 : 0,
                    }}
                  >
                    {getInitials(d.name)}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                saídas em aberto
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Nenhum carro na rua
            </span>
          )}
        </div>
      </div>

      {/* 4) Card Registros para conferir */}
      <button
        type="button"
        onClick={onSelectIncomplete}
        className="card trip-card-check"
        style={{
          background: hasIncomplete ? "var(--warning-bg)" : "var(--success-bg)",
          border: "1px solid var(--border)",
          borderRadius: 22,
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          textDecoration: "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: hasIncomplete ? "var(--warning)" : "var(--success)",
            lineHeight: 1,
            display: "flex",
          }}
        >
          <Odometer
            value={totals.incomplete}
            ariaLabel={`${totals.incomplete} registros para conferir`}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            {hasIncomplete ? "Registros para conferir" : "Tudo conferido"}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            {hasIncomplete
              ? "Saída sem retorno ou km incoerente"
              : "Nenhuma pendência encontrada"}
          </span>
        </div>
        {hasIncomplete && (
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "var(--warning)",
              color: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowRight size={16} strokeWidth={2.4} />
          </span>
        )}
      </button>
    </div>
  );
}
