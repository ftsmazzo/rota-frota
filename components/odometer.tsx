"use client";

import React, { useEffect, useState } from "react";

const REEL = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];

export interface OdometerProps {
  value: number;
  className?: string;
  ariaLabel?: string;
}

export function Odometer({ value, className = "", ariaLabel }: OdometerProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [value]);

  const num = Math.max(0, Math.round(Math.abs(value || 0)));
  const digits = String(num).split("");
  const label = ariaLabel || String(value);

  return (
    <span
      className={`odometer-root ${className}`.trim()}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          lineHeight: 1,
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {digits.map((ch, i) => {
          const digit = Number(ch) || 0;
          const y = animated ? -(10 + digit) : 0;
          const delay = `${i * 0.12}s`;

          return (
            <span
              key={i}
              className="odo"
              style={{
                display: "inline-block",
                height: "1em",
                overflow: "hidden",
                lineHeight: 1,
                verticalAlign: "top",
              }}
            >
              <span
                className="odo-col"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  transform: `translateY(${y}em)`,
                  transition: "transform 1.4s cubic-bezier(.16,.84,.24,1)",
                  transitionDelay: delay,
                }}
              >
                {REEL.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: "1em",
                      lineHeight: 1,
                      display: "block",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
