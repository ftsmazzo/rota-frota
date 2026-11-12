import React from "react";
import { ArrowUpRight, ArrowDownLeft, Camera, Download } from "lucide-react";
import type { Inspection, Vehicle, Driver } from "../lib/model";
import { shortDate, inspectionCode } from "../lib/model";
import { PhotoView } from "./photo-view";
import { BrPlate, LiveDot } from "./ui";

export interface ReportCardProps {
  inspection: Inspection;
  vehicle?: Vehicle;
  driver?: Driver;
  index?: number;
  onOpen: () => void;
  onDownload: (e: React.MouseEvent, inspection: Inspection) => void;
}

export function ReportCard({
  inspection,
  vehicle,
  driver,
  index = 0,
  onOpen,
  onDownload,
}: ReportCardProps) {
  const nameParts = (vehicle?.model || "Veículo").trim().split(/\s+/);
  const brand = nameParts[0]?.toUpperCase() || "";
  const model = nameParts.slice(1).join(" ") || brand;
  const isDeparture = inspection.kind === "departure";
  const hasFindings = inspection.findings && inspection.findings.length > 0;

  return (
    <article
      className="report-card rise"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="report-preview-wrap">
        <div
          className="mini-report"
          onClick={onOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen();
            }
          }}
          aria-label={`Visualizar prévia do relatório ${vehicle?.model || ""}`}
        >
          <div>
            <span className="mini-logo">rota.</span>
            <small className="mono">{inspectionCode(inspection.id)}</small>
          </div>
          <span>RELATÓRIO DE VISTORIA</span>
          <strong className="mini-report-title">{vehicle?.model}</strong>
          <div className="mini-lines">
            <i />
            <i />
            <i />
          </div>
          <div className="mini-photo-row">
            {inspection.photos.slice(0, 3).map((p) => (
              <PhotoView key={p.id} photo={p} />
            ))}
          </div>
          <div className="mini-lines short">
            <i />
            <i />
          </div>
        </div>

        <button
          type="button"
          className="report-round-download"
          aria-label={`Baixar PDF ${vehicle?.model || ""}`}
          title="Baixar PDF"
          onClick={(e) => onDownload(e, inspection)}
        >
          <Download size={16} />
        </button>
      </div>

      <div className="report-card-copy">
        <div className="report-card-badges">
          {isDeparture ? (
            <span className="operation-seal departure">
              <ArrowUpRight size={14} className="arrow-sliding" />
              Saída
            </span>
          ) : (
            <span className="operation-seal return">
              <ArrowDownLeft size={14} />
              Retorno
            </span>
          )}

          {hasFindings && (
            <span className="chip-issue">
              <LiveDot color="var(--warning)" />
              Com apontamento
            </span>
          )}

          {inspection.pending && (
            <span className="badge blue">
              <LiveDot color="var(--info)" />
              Envio pendente
            </span>
          )}
        </div>

        <div className="report-card-vehicle-row">
          <BrPlate plate={vehicle?.plate || "—"} size="sm" />
          <div className="report-card-title-block">
            <span className="report-card-brand">{brand}</span>
            <strong className="report-card-model">{model}</strong>
          </div>
        </div>

        <div className="report-card-meta-row">
          <span className="report-photos-chip">
            <Camera size={13} />
            <span>
              {inspection.photos.length} {inspection.photos.length === 1 ? "foto" : "fotos"}
            </span>
          </span>
          <span className="report-date mono">{shortDate(inspection.finishedAt)}</span>
        </div>

        <button
          type="button"
          className="button secondary report-open-btn"
          onClick={onOpen}
        >
          Abrir relatório <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
}

export default ReportCard;
