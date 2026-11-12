import React from "react";

export interface BrPlateProps {
  plate: string;
  size?: "sm" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export function BrPlate({
  plate,
  size = "sm",
  className = "",
  style,
}: BrPlateProps) {
  const displayPlate = (plate || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const isLg = size === "lg";

  const width = isLg ? 180 : 124;
  const height = isLg ? 58 : 40;
  const borderRadius = isLg ? 8 : 6;
  const borderWidth = isLg ? "2.5px" : "2px";
  const blueBarHeight = isLg ? 14 : 10;
  const topTextSize = isLg ? "9px" : "6.5px";
  const flagW = isLg ? 14 : 10;
  const flagH = isLg ? 10 : 7;
  const charsFontSize = isLg ? 32 : 22;

  return (
    <div
      className={`br-plate ${className}`.trim()}
      aria-label={`Placa Mercosul ${plate}`}
      style={{
        width,
        height,
        boxSizing: "border-box",
        borderRadius,
        border: `${borderWidth} solid #1b1b1b`,
        background: "#ffffff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 0 #ffffff inset, 0 2px 4px #0000001f",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          height: blueBarHeight,
          background: "#1f4fa3",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isLg ? "0 6px" : "0 4px",
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontSize: topTextSize,
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
            fontSize: topTextSize,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: ".14em",
            lineHeight: 1,
          }}
        >
          BRASIL
        </span>
        <svg
          width={flagW}
          height={flagH}
          viewBox="0 0 20 14"
          aria-hidden="true"
          style={{ display: "block" }}
        >
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
          fontSize: charsFontSize,
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

export default BrPlate;
