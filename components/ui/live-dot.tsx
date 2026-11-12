import React from "react";

export interface LiveDotProps {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LiveDot({
  color = "var(--accent)",
  className = "",
  style,
}: LiveDotProps) {
  return (
    <span
      className={`live ${className}`.trim()}
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        color: color,
        boxShadow: `0 0 0 0 ${color}`,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export default LiveDot;
