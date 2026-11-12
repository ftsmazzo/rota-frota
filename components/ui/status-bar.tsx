import React from "react";

export interface StatusBarProps {
  available?: number;
  out?: number;
  attention?: number;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  totalSegments?: number;
  activeSegment?: number;
}

export function StatusBar({
  available = 0,
  out = 0,
  attention = 0,
  height = 8,
  className = "",
  style,
  totalSegments,
  activeSegment = 0,
}: StatusBarProps) {
  const h = typeof height === "number" ? `${height}px` : height;

  if (totalSegments && totalSegments > 0) {
    return (
      <div
        className={`live-status-bar wizard-status-bar ${className}`.trim()}
        role="progressbar"
        aria-label={`Etapa ${activeSegment + 1} de ${totalSegments}`}
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
        {Array.from({ length: totalSegments }).map((_, idx) => (
          <div
            key={idx}
            className={`live-status-segment wizard-seg ${idx <= activeSegment ? "active" : ""}`}
            style={{
              flex: 1,
              height: "100%",
              borderRadius: 2,
              background: idx <= activeSegment ? "var(--accent)" : "var(--border)",
              opacity: idx <= activeSegment ? 1 : 0.45,
              transition: "background 0.25s ease, opacity 0.25s ease",
            }}
          />
        ))}
      </div>
    );
  }

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
