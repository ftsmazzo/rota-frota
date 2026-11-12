"use client";

import { useEffect, useRef, useState } from "react";

interface ParsedNumber {
  isNum: boolean;
  target: number;
  prefix: string;
  suffix: string;
  pad: number;
  hasThousandSep: boolean;
  decimals: number;
  text?: string;
}

function parseValue(val: number | string): ParsedNumber {
  if (typeof val === "number") {
    return {
      isNum: true,
      target: val,
      prefix: "",
      suffix: "",
      pad: 0,
      hasThousandSep: false,
      decimals: 0,
    };
  }
  const str = String(val).trim();
  const match = str.match(/^([^0-9]*?)([0-9][0-9.,]*)([^0-9]*)$/);
  if (!match) {
    return {
      isNum: false,
      target: 0,
      prefix: "",
      suffix: "",
      pad: 0,
      hasThousandSep: false,
      decimals: 0,
      text: str,
    };
  }

  const prefix = match[1];
  const numStr = match[2];
  const suffix = match[3];

  let cleanNum = numStr;
  let hasThousandSep = false;
  let decimals = 0;

  if (numStr.includes(".") && numStr.includes(",")) {
    hasThousandSep = true;
    decimals = numStr.split(",")[1]?.length || 0;
    cleanNum = numStr.replace(/\./g, "").replace(",", ".");
  } else if (numStr.includes(",")) {
    decimals = numStr.split(",")[1]?.length || 0;
    cleanNum = numStr.replace(",", ".");
  } else if (numStr.includes(".")) {
    const parts = numStr.split(".");
    if (parts.slice(1).every((p) => p.length === 3)) {
      hasThousandSep = true;
      cleanNum = numStr.replace(/\./g, "");
    } else {
      decimals = parts[1]?.length || 0;
    }
  }

  const target = parseFloat(cleanNum);
  if (isNaN(target)) {
    return {
      isNum: false,
      target: 0,
      prefix: "",
      suffix: "",
      pad: 0,
      hasThousandSep: false,
      decimals: 0,
      text: str,
    };
  }

  const pad =
    !hasThousandSep && decimals === 0 && numStr.startsWith("0") && numStr.length > 1
      ? numStr.length
      : 0;

  return { isNum: true, target, prefix, suffix, pad, hasThousandSep, decimals };
}

function formatCurrent(current: number, meta: ParsedNumber): string {
  if (!meta.isNum) return meta.text || "";
  let formatted: string;
  if (meta.pad > 0) {
    formatted = String(Math.round(current)).padStart(meta.pad, "0");
  } else if (meta.hasThousandSep || meta.decimals > 0) {
    formatted = current.toLocaleString("pt-BR", {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    });
  } else {
    formatted = String(Math.round(current));
  }
  return meta.prefix + formatted + meta.suffix;
}

export function CountUp({
  value,
  className = "",
}: {
  value: number | string;
  className?: string;
}) {
  const meta = parseValue(value);

  const [display, setDisplay] = useState<string>(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return formatCurrent(prefersReduced ? meta.target : 0, meta);
  });

  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !meta.isNum) {
      setDisplay(formatCurrent(meta.target, meta));
      return;
    }

    // Se já animou na primeira exibição, atualiza diretamente sem recontar do zero
    if (hasAnimatedRef.current) {
      setDisplay(formatCurrent(meta.target, meta));
      return;
    }
    hasAnimatedRef.current = true;

    if (meta.target === 0) {
      setDisplay(formatCurrent(0, meta));
      return;
    }

    const duration = 600;
    let start: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic: aceleração inicial rápida e desaceleração suave
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = meta.target * ease;
      setDisplay(formatCurrent(current, meta));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplay(formatCurrent(meta.target, meta));
      }
    };

    setDisplay(formatCurrent(0, meta));
    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [meta.target]);

  return <span className={className}>{display}</span>;
}

export { CountUp as AnimatedNumber };
