"use client";

import React from "react";

export interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  eyebrow = "GESTÃO DA FROTA",
  title,
  subtitle,
  summary,
  actions,
  className = "",
  children,
}: PageHeaderProps) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="page-header-main">
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {(summary || actions || children) && (
        <div className="page-header-aside">
          {summary && <div className="page-header-summary">{summary}</div>}
          {actions && <div className="page-header-actions">{actions}</div>}
          {children}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
