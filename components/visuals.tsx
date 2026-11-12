import React from "react";

const BODIES: Record<string, string> = {
  hatch: "M35 88 62 78 112 40 228 38 262 70 344 82 367 99 361 114 37 114Z",
  pickup: "M35 85 57 76 84 73 114 38 206 38 234 75 349 75 366 93 362 112 36 112Z",
  suv: "M36 85 65 78 106 34 266 34 312 74 356 83 369 103 360 116 38 115Z",
  sedan: "M35 88 66 78 117 42 234 40 292 75 344 82 367 99 361 114 37 114Z",
};

const GLASSES: Record<string, string> = {
  hatch: "m88 74 32-29 47-2v31Zm90 0V44h44l32 30Z",
  pickup: "m99 72 22-27h37v27Zm67 0V45h33l24 27Z",
  suv: "m90 74 34-27 49-1v28Zm92 0V46h47l44 28Z",
  sedan: "m90 74 34-27 49-1v28Zm92 0V46h47l44 28Z",
};

function resolvePaint(color?: string): string {
  if (!color) return "#eef2ee";
  const c = color.trim().toLowerCase();
  if (c === "cinza") return "#a9b7ae";
  if (c === "prata") return "#c7d2cd";
  if (c === "branco") return "#eef2ee";
  if (c === "preto") return "#1b2420";
  if (c === "vermelho") return "#b94a48";
  if (c === "azul") return "#3b6e8c";
  return color;
}

export function CarIllustration({
  type = "sedan",
  color = "var(--surface-2)",
  className = "",
  state,
  style,
}: {
  type?: string;
  color?: string;
  className?: string;
  state?: "moving" | "free" | "warn";
  style?: React.CSSProperties;
}) {
  const bodyPath = BODIES[type] || BODIES.sedan;
  const glassPath = GLASSES[type] || GLASSES.sedan;
  const paint = resolvePaint(color);

  let headlight = "#f5f0d8";
  let taillight = "#c9a39b";
  let frontWheelClass = "";

  if (state === "warn") {
    headlight = "#f2a43a";
    taillight = "#f2a43a";
    frontWheelClass = "flat";
  } else if (state === "moving") {
    headlight = "#fff6c9";
    taillight = "#e2685a";
  }

  const svgClasses = [
    className,
    state ? `st-${state}` : "",
    state || "",
  ].filter(Boolean).join(" ");

  return (
    <svg
      className={svgClasses}
      style={style}
      viewBox="0 0 400 150"
      fill="none"
      aria-hidden="true"
    >
      {/* Sombra */}
      <ellipse cx="204" cy="134" rx="150" ry="8" fill="#000" opacity=".12" />

      {/* Carroceria dentro de tilt e body */}
      <g className="tilt">
        <g className="body">
          <path d={bodyPath} fill={paint} stroke="var(--car-line)" strokeWidth="2" />
          <path d={glassPath} fill="var(--glass)" />
          <path d="M93 84h191M181 79v31" stroke="var(--car-line)" strokeWidth="2" />
          <path className="lamp" d="m340 85 16 4 8 11-21-4Z" fill={headlight} stroke="var(--car-line)" />
          <path className="lamp" d="m36 93 24 2 6 10H37Z" fill={taillight} stroke="var(--car-line)" />
        </g>
      </g>

      {/* Roda traseira */}
      <g className="wheel">
        <circle cx="100" cy="113" r="26" fill="var(--tire)" />
        <circle cx="100" cy="113" r="14" fill="#d8e1dc" />
        <path d="M100 100v26M87 113h26M91 104l18 18M91 122l18-18" stroke="#8fa198" strokeWidth="3" />
      </g>

      {/* Roda dianteira */}
      <g className={`wheel ${frontWheelClass}`.trim()}>
        <circle cx="301" cy="113" r="26" fill="var(--tire)" />
        <circle cx="301" cy="113" r="14" fill="#d8e1dc" />
        <path d="M301 100v26M288 113h26M292 104l18 18M292 122l18-18" stroke="#8fa198" strokeWidth="3" />
      </g>
    </svg>
  );
}

export { CarMap } from "./car-map";
