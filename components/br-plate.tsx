import React from "react";

export function BrPlate({ plate, className = "" }: { plate: string; className?: string }) {
  const displayPlate = (plate || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return (
    <div
      className={`br-plate ${className}`.trim()}
      aria-label={`Placa Mercosul ${plate}`}
      style={{
        width: 124,
        height: 40,
        boxSizing: "border-box",
        borderRadius: 6,
        border: "2px solid #1b1b1b",
        background: "#ffffff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 0 #ffffff inset, 0 2px 4px #0000001f",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 10,
          background: "#1f4fa3",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontSize: "6.5px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: ".04em",
            lineHeight: 1,
          }}
        >
          BR
        </span>
        <span
          style={{
            fontSize: "6.5px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: ".14em",
            lineHeight: 1,
          }}
        >
          BRASIL
        </span>
        <svg width="10" height="7" viewBox="0 0 20 14" aria-hidden="true" style={{ display: "block" }}>
          <rect width="20" height="14" fill="#1c8a3e" />
          <path d="M10 1.5 18.5 7 10 12.5 1.5 7Z" fill="#f5d000" />
          <circle cx="10" cy="7" r="3.2" fill="#1f4fa3" />
        </svg>
      </div>
      <div
        className="plate-chars"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          lineHeight: 1,
          color: "#111111",
          letterSpacing: ".06em",
          fontFamily: 'var(--font-plate, "Barlow Condensed"), "Arial Narrow", sans-serif',
          fontWeight: 600,
        }}
      >
        {displayPlate}
      </div>
    </div>
  );
}
