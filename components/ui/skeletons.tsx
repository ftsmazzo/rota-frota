"use client";

import React from "react";

/**
 * 4.8 — Skeletons no formato exato dos cards finais, com brilho (shimmer).
 */

export function VehicleCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="vehicle-card skeleton-card"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden="true"
    >
      {/* 1) Topo: badge e unidade */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span
          className="skeleton-line"
          style={{ width: 72, height: 20, borderRadius: 999 }}
        />
        <span
          className="skeleton-line"
          style={{ width: 50, height: 13, borderRadius: 4 }}
        />
      </div>

      {/* 2) Palco do carro */}
      <div
        className="skeleton-box"
        style={{
          position: "relative",
          height: 86,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 12,
            transform: "translateX(-50%)",
            width: 120,
            height: 38,
            borderRadius: 8,
            opacity: 0.4,
            background: "var(--border)",
          }}
        />
      </div>

      {/* 3) Nome: Marca + Modelo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span
          className="skeleton-line"
          style={{ width: 55, height: 11, borderRadius: 3 }}
        />
        <span
          className="skeleton-line"
          style={{ width: 110, height: 20, borderRadius: 4 }}
        />
      </div>

      {/* 4) Placa Mercosul */}
      <div
        className="skeleton-box"
        style={{
          width: 124,
          height: 40,
          borderRadius: 6,
          border: "1px solid var(--border)",
        }}
      />

      {/* 5) Linha técnica */}
      <div style={{ display: "flex", gap: 10 }}>
        <span className="skeleton-line" style={{ width: 60, height: 12 }} />
        <span className="skeleton-line" style={{ width: 45, height: 12 }} />
      </div>

      {/* 6) Rodapé */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 10,
          minHeight: 34,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          className="skeleton-box"
          style={{ width: "100%", height: 36, borderRadius: 11 }}
        />
      </div>
    </article>
  );
}

export function InspectionCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="inspection-card skeleton-card"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden="true"
    >
      <div className="inspection-card-top">
        <div className="inspection-card-vehicle">
          <div
            className="skeleton-box"
            style={{ width: 124, height: 40, borderRadius: 6 }}
          />
          <div className="inspection-card-title-block">
            <span
              className="skeleton-line"
              style={{ width: 45, height: 11, borderRadius: 3, marginBottom: 4 }}
            />
            <span
              className="skeleton-line"
              style={{ width: 90, height: 17, borderRadius: 4 }}
            />
          </div>
        </div>

        <div className="inspection-card-badges">
          <span
            className="skeleton-line"
            style={{ width: 70, height: 24, borderRadius: 999 }}
          />
        </div>
      </div>

      <div className="inspection-card-middle">
        <div className="driver-line">
          <span
            className="skeleton-line"
            style={{ width: 28, height: 28, borderRadius: "50%" }}
          />
          <span
            className="skeleton-line"
            style={{ width: 85, height: 14, borderRadius: 4 }}
          />
        </div>

        <div className="inspection-card-meta-tags">
          <span
            className="skeleton-line"
            style={{ width: 60, height: 14, borderRadius: 4 }}
          />
        </div>
      </div>

      <div className="inspection-card-bottom">
        <div className="inspection-card-tech">
          <span
            className="skeleton-line"
            style={{ width: 110, height: 12, borderRadius: 3 }}
          />
          <span
            className="skeleton-line"
            style={{ width: 55, height: 12, borderRadius: 3 }}
          />
        </div>

        <span
          className="skeleton-line"
          style={{ width: 80, height: 14, borderRadius: 4 }}
        />
      </div>
    </article>
  );
}

export function TeamCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="team-card skeleton-card"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden="true"
    >
      <div className="team-card-top">
        <div className="team-card-person">
          <span
            className="skeleton-line"
            style={{ width: 44, height: 44, borderRadius: "50%" }}
          />
          <div className="team-card-identity">
            <span
              className="skeleton-line"
              style={{ width: 100, height: 16, borderRadius: 4, marginBottom: 4 }}
            />
            <span
              className="skeleton-line"
              style={{ width: 65, height: 12, borderRadius: 3 }}
            />
          </div>
        </div>

        <span
          className="skeleton-line"
          style={{ width: 75, height: 22, borderRadius: 999 }}
        />
      </div>

      <div className="team-card-bottom">
        <span
          className="skeleton-line"
          style={{ width: 80, height: 22, borderRadius: 4 }}
        />
        <span
          className="skeleton-line"
          style={{ width: 75, height: 12, borderRadius: 3 }}
        />
      </div>
    </article>
  );
}

export function ReportCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="report-card skeleton-card"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden="true"
    >
      <div
        className="mini-report skeleton-box"
        style={{
          margin: "18px 24px 0",
          height: 160,
          transform: "rotate(-2deg)",
          borderRadius: 8,
        }}
      />
      <div className="report-card-copy">
        <span
          className="skeleton-line"
          style={{ width: 120, height: 16, borderRadius: 4, marginBottom: 8 }}
        />
        <span
          className="skeleton-line"
          style={{ width: "80%", height: 13, borderRadius: 3, marginBottom: 14 }}
        />
        <span
          className="skeleton-box"
          style={{ width: "100%", height: 36, borderRadius: 9 }}
        />
      </div>
    </article>
  );
}

export function StatCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="stat-card skeleton-card"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden="true"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="skeleton-line" style={{ width: "55%", height: 13 }} />
        <span
          className="skeleton-line"
          style={{ width: 28, height: 28, borderRadius: 8 }}
        />
      </div>
      <span
        className="skeleton-line"
        style={{ width: "40%", height: 30, margin: "10px 0 8px", borderRadius: 6 }}
      />
      <span className="skeleton-line" style={{ width: "70%", height: 12 }} />
    </div>
  );
}

export function LiveHeroSkeleton() {
  return (
    <section
      className="live-hero skeleton-card"
      style={{
        borderRadius: 28,
        padding: "22px 20px",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
      aria-hidden="true"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="skeleton-line" style={{ width: 75, height: 20, borderRadius: 999 }} />
        <span className="skeleton-line" style={{ width: 70, height: 14 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "6px 0" }}>
        <span className="skeleton-line" style={{ width: 220, height: 28, borderRadius: 6 }} />
        <span className="skeleton-line" style={{ width: 160, height: 28, borderRadius: 6 }} />
      </div>

      <div
        className="skeleton-box"
        style={{ height: 120, borderRadius: 16, margin: "6px 0" }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="skeleton-line" style={{ width: "100%", height: 8, borderRadius: 4 }} />
        <div style={{ display: "flex", gap: 14 }}>
          <span className="skeleton-line" style={{ width: 80, height: 13 }} />
          <span className="skeleton-line" style={{ width: 80, height: 13 }} />
          <span className="skeleton-line" style={{ width: 80, height: 13 }} />
        </div>
      </div>

      <span
        className="skeleton-box"
        style={{ width: "100%", height: 54, borderRadius: 16, marginTop: 4 }}
      />
    </section>
  );
}
