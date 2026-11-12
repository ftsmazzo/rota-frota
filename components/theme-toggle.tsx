"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type ThemeMode = "light" | "dark" | "auto";

interface ThemeToggleProps {
  variant?: "topbar" | "sidebar";
  className?: string;
}

export function ThemeToggle({ variant = "topbar", className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("theme") as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "auto") {
        setTheme(saved);
      }
    } catch {}

    const handleSync = () => {
      try {
        const current = (localStorage.getItem("theme") as ThemeMode | null) || "auto";
        setTheme(current);
      } catch {}
    };

    window.addEventListener("theme-change", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("theme-change", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const changeTheme = (mode: ThemeMode) => {
    setTheme(mode);
    try {
      localStorage.setItem("theme", mode);
      if (mode === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else if (mode === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      window.dispatchEvent(new Event("theme-change"));
    } catch {}
  };

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: "Claro", icon: Sun },
    { mode: "dark", label: "Escuro", icon: Moon },
    { mode: "auto", label: "Automático", icon: Monitor },
  ];

  return (
    <div
      className={`theme-toggle theme-toggle-${variant} ${className}`.trim()}
      role="radiogroup"
      aria-label="Tema visual"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = mounted ? theme === opt.mode : opt.mode === "auto";
        return (
          <button
            key={opt.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`Tema ${opt.label}`}
            className={isActive ? "active" : ""}
            onClick={() => changeTheme(opt.mode)}
          >
            <Icon size={variant === "sidebar" ? 14 : 13} />
            <span className="theme-toggle-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
