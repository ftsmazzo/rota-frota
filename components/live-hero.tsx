"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import type { Vehicle, Inspection, Driver } from "../lib/model";

interface LiveHeroProps {
  vehicles: Vehicle[];
  inspections: Inspection[];
  drivers: Driver[];
  counts: {
    available: number;
    out: number;
    attention: number;
  };
  getVehicleState: (v: Vehicle, inspections: Inspection[]) => "available" | "out" | "attention" | "maintenance";
  onStartInspection: () => void;
}

export function LiveHero({
  vehicles,
  inspections,
  drivers,
  counts,
  getVehicleState,
  onStartInspection,
}: LiveHeroProps) {
  const totalVehicles = vehicles.length;

  // Title text logic
  const titleText = useMemo(() => {
    if (counts.available === 0) {
      return "Nenhum carro disponível agora.";
    }
    if (counts.available === 1) {
      return "1 carro pronto para sair agora.";
    }
    return `${counts.available} carros prontos para sair agora.`;
  }, [counts.available]);

  // Out vehicles (travelers) along the road
  const travelers = useMemo(() => {
    const outList = vehicles.filter((v) => getVehicleState(v, inspections) === "out");
    return outList.slice(0, 4).map((vehicle, idx) => {
      // Find latest departure inspection for this vehicle
      const lastDeparture = inspections
        .filter((i) => i.vehicleId === vehicle.id && i.kind === "departure")
        .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];

      const driver = drivers.find((d) => d.id === (lastDeparture?.driverId || vehicle.driver));
      const initials =
        driver?.initials ||
        (driver?.name
          ? driver.name
              .split(" ")
              .filter(Boolean)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          : "OP");

      const shortModel = vehicle.model.split(" ")[0] || vehicle.model;

      // Staggered durations (9s-12s) and negative delays so they don't move together
      const presets = [
        { duration: "10s", delay: "-1.8s" },
        { duration: "11.5s", delay: "-4.6s" },
        { duration: "9.2s", delay: "-7.3s" },
        { duration: "12s", delay: "-9.8s" },
      ];
      const preset = presets[idx % presets.length];

      return {
        id: vehicle.id,
        initials,
        shortModel,
        duration: preset.duration,
        delay: preset.delay,
      };
    });
  }, [vehicles, inspections, drivers, getVehicleState]);

  // Recent events ticker (switch every 3s among top 3 most recent inspections)
  const recentEvents = useMemo(() => {
    const sorted = [...inspections].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, 3);
    return sorted.map((insp) => {
      const driver = drivers.find((d) => d.id === insp.driverId);
      const vehicle = vehicles.find((v) => v.id === insp.vehicleId);
      const driverName = driver?.name.split(" ")[0] || "Motorista";
      const vehicleModel = vehicle?.model || "veículo";
      const action = insp.kind === "departure" ? "saiu com o" : "devolveu o";
      const time = new Date(insp.finishedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        id: insp.id,
        text: `${driverName} ${action} ${vehicleModel}`,
        time,
      };
    });
  }, [inspections, drivers, vehicles]);

  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    if (recentEvents.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % recentEvents.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [recentEvents.length]);

  const activeEvent = recentEvents[tickerIndex];

  return (
    <section className="live-hero" aria-label="Visão geral ao vivo da frota">
      {/* 1) Top line */}
      <div className="live-hero-top">
        <div className="live-top-badge">
          <span className="live-dot" aria-hidden="true" />
          <span>AO VIVO</span>
        </div>
        <span className="live-total-vehicles">{totalVehicles} veículos</span>
      </div>

      {/* Main hero content */}
      <div className="live-hero-content">
        {/* 2) Title */}
        <h2 className="live-hero-title">
          {counts.available === 0 ? (
            "Nenhum carro disponível agora."
          ) : (
            <>
              {counts.available === 1 ? "1 carro pronto" : `${counts.available} carros prontos`}
              <br />
              para sair agora.
            </>
          )}
        </h2>

        {/* 3 & 4) Estrada animada + Viajantes */}
        <div className="live-road-section">
          <div className="live-road-bleed">
            <div className="live-road-stage">
              <svg
                className="live-road-svg"
                viewBox="-10 0 420 170"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {/* Traço largo da estrada (30px, opacidade .16) */}
                <path
                  d="M-10 150 C 50 150, 70 70, 140 78 S 230 140, 330 30 S 380 10, 400 8"
                  stroke="#b9d7ad"
                  strokeWidth="30"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.16"
                />
                {/* Linha tracejada central (1.5px, dasharray 8 7) */}
                <path
                  className="live-road-dashed"
                  d="M-10 150 C 50 150, 70 70, 140 78 S 230 140, 330 30 S 380 10, 400 8"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeDasharray="8 7"
                  strokeLinecap="round"
                />
                {/* Ponto da base no início (círculo lima de 6px com halo) */}
                <circle cx="16" cy="150" r="14" fill="var(--accent)" fillOpacity="0.16" />
                <circle cx="16" cy="150" r="3" fill="var(--accent)" />
              </svg>

              {/* Rótulo da Base */}
              <div className="live-base-tag">
                <span>Base · {counts.available} na garagem</span>
              </div>

              {/* Viajantes (máx 4 chips) */}
              {travelers.map((t) => (
                <div
                  key={t.id}
                  className="live-traveler-chip"
                  style={
                    {
                      "--travel-duration": t.duration,
                      "--travel-delay": t.delay,
                    } as React.CSSProperties
                  }
                >
                  <span className="live-traveler-avatar">{t.initials}</span>
                  <span className="live-traveler-model">{t.shortModel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5) Barra de status + legenda */}
        <div className="live-status-group">
          <div className="live-status-bar" role="progressbar" aria-label="Status dos veículos">
            {counts.available > 0 && (
              <div
                className="live-status-segment available"
                style={{ flex: counts.available }}
                title={`${counts.available} disponíveis`}
              />
            )}
            {counts.out > 0 && (
              <div
                className="live-status-segment out"
                style={{ flex: counts.out }}
                title={`${counts.out} em uso`}
              />
            )}
            {counts.attention > 0 && (
              <div
                className="live-status-segment attention"
                style={{ flex: counts.attention }}
                title={`${counts.attention} atenção`}
              />
            )}
            {counts.available === 0 && counts.out === 0 && counts.attention === 0 && (
              <div className="live-status-segment available" style={{ flex: 1 }} />
            )}
          </div>

          <div className="live-status-legend">
            <span className="live-legend-item">
              <strong className="live-legend-num tech-mono">{counts.available}</strong>
              <span className="live-legend-label">disponíveis</span>
            </span>
            <span className="live-legend-item">
              <strong className="live-legend-num tech-mono">{counts.out}</strong>
              <span className="live-legend-label">em uso</span>
            </span>
            <span className="live-legend-item">
              <strong className="live-legend-num tech-mono">{counts.attention}</strong>
              <span className="live-legend-label">atenção</span>
            </span>
          </div>
        </div>

        {/* 6) Botão Registrar uma saída */}
        <button
          type="button"
          className="live-hero-cta"
          onClick={onStartInspection}
        >
          <span>Registrar uma saída</span>
          <ArrowUpRight size={19} />
        </button>
      </div>

      {/* 7) Rodapé com borda superior fina */}
      <footer className="live-hero-footer">
        <Clock size={14} className="live-footer-clock" aria-hidden="true" />
        <div className="live-footer-ticker">
          {activeEvent ? (
            <span key={tickerIndex} className="live-ticker-item">
              <span>{activeEvent.text}</span>
              <span className="live-ticker-dot">·</span>
              <span className="live-ticker-time tech-mono">{activeEvent.time}</span>
            </span>
          ) : (
            <span className="live-ticker-empty">Nenhuma movimentação hoje</span>
          )}
        </div>
      </footer>
    </section>
  );
}
