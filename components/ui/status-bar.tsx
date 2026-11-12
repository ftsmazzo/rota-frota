import React from "react";

export interface StatusBarProps {
  available?: number;
  out?: number;
  attention?: number;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatusBar({
  available = 0,
  out = 0,
  attention = 0,
  height = 8,
  className = "",
  style,
}: StatusBarProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  const isAllZero = available === 0 && out === 0 && attention === 0;

  return (
    <div
      className={`live-status-bar ${className}`.trim()}
      role="progressbar"
      aria-label="Status dos veículos"
      style={{
        display: "flex",
        height: h,
        gap: 4,
        width: "100%",
        borderRadius: typeof height === "number" ? Math.max(2, Math.round(height / 2)) : 4,
        overflow: "hidden",
        ...style,
      }}
    >
      {(available > 0 || isAllZero) && (
        <div
          className="live-status-segment available seg"
          style={{ flex: available || 1, background: "var(--accent)", height: "100%", borderRadius: 2 }}
          title={`${available} disponíveis`}
        />
      )}
      {out > 0 && (
        <div
          className="live-status-segment out seg"
          style={{ flex: out, background: "#8db4d1", height: "100%", borderRadius: 2 }}
          title={`${out} em uso`}
        />
      )}
      {attention > 0 && (
        <div
          className="live-status-segment attention seg"
          style={{ flex: attention, background: "#e0a965", height: "100%", borderRadius: 2 }}
          title={`${attention} atenção`}
        />
      )}
    </div>
  );
}

export default StatusBar;
