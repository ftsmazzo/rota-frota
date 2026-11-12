import React from "react";
import { ArrowUpRight, ArrowDownLeft, MapPin, Camera } from "lucide-react";
import type { Inspection, Vehicle, Driver } from "../lib/model";
import { shortDate, km } from "../lib/model";
import { BrPlate, LiveDot } from "./ui";
import { Avatar } from "./common";

export interface InspectionCardProps {
  inspection: Inspection;
  vehicle?: Vehicle;
  driver?: Driver;
  index?: number;
  onOpen: () => void;
}

export function InspectionCard({
  inspection,
  vehicle,
  driver,
  index = 0,
  onOpen,
}: InspectionCardProps) {
  const nameParts = (vehicle?.model || "Veículo").trim().split(/\s+/);
  const brand = nameParts[0]?.toUpperCase() || "";
  const model = nameParts.slice(1).join(" ") || brand;
  const isDeparture = inspection.kind === "departure";
  const hasFindings = inspection.findings && inspection.findings.length > 0;

  return (
    <article
      className="inspection-card rise"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Vistoria de ${isDeparture ? "saída" : "retorno"} do veículo ${vehicle?.model || ""}`}
    >
      <div className="inspection-card-top">
        <div className="inspection-card-vehicle">
          <BrPlate plate={vehicle?.plate || "—"} size="sm" />
          <div className="inspection-card-title-block">
            <span className="inspection-card-brand">{brand}</span>
            <strong className="inspection-card-model">{model}</strong>
          </div>
        </div>

        <div className="inspection-card-badges">
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
      </div>

      <div className="inspection-card-middle">
        <div className="driver-line">
          <Avatar driver={driver} small />
          <span className="inspection-driver-name">{driver?.name || "Motorista"}</span>
        </div>

        <div className="inspection-card-meta-tags">
          {inspection.destination && (
            <span className="inspection-meta-item" title="Destino">
              <MapPin size={13} />
              <span>{inspection.destination}</span>
            </span>
          )}
          {inspection.photos?.length > 0 && (
            <span className="inspection-photos-chip" title="Fotos anexadas">
              <Camera size={13} />
              <span>{inspection.photos.length}</span>
            </span>
          )}
        </div>
      </div>

      <div className="inspection-card-bottom">
        <div className="inspection-card-tech">
          <span className="inspection-card-date mono">
            {shortDate(inspection.finishedAt)} ·{" "}
            {new Date(inspection.finishedAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="inspection-card-odometer mono">{km(inspection.odometer)}</span>
        </div>

        <button
          type="button"
          className="text-button inspection-card-action"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Ver relatório <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}

export default InspectionCard;
