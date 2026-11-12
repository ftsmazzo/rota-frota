import React from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import type { Vehicle, Inspection, Driver } from "../lib/model";
import { openVehicleFindings } from "../lib/model";
import { CarIllustration } from "./visuals";
import { BrPlate } from "./br-plate";

export interface VehicleCardProps {
  vehicle: Vehicle;
  inspections: Inspection[];
  drivers: Driver[];
  index?: number;
  onOpenDetail: (vehicle: Vehicle) => void;
  onStartInspection: (vehicle?: Vehicle) => void;
  getVehicleState: (v: Vehicle, inspections: Inspection[]) => "available" | "out" | "attention" | "maintenance";
  vehicleNeedsAttention: (vehicleId: string, inspections: Inspection[]) => boolean;
}

export function VehicleCard({
  vehicle,
  inspections,
  drivers,
  index = 0,
  onOpenDetail,
  onStartInspection,
  getVehicleState,
  vehicleNeedsAttention,
}: VehicleCardProps) {
  const rawState = getVehicleState(vehicle, inspections);
  const needsAttention =
    vehicleNeedsAttention(vehicle.id, inspections) ||
    rawState === "attention" ||
    rawState === "maintenance";

  let cardState: "moving" | "free" | "warn";
  if (rawState === "out") {
    cardState = "moving";
  } else if (needsAttention) {
    cardState = "warn";
  } else {
    cardState = "free";
  }

  // 1) Topo: badge e unidade
  const shortUnit = (vehicle.unit || "").replace(/^Unidade\s+/i, "").trim();

  let statusLabel = "Disponível";
  let badgeColor = "var(--success)";
  let badgeBg = "var(--success-bg)";
  let stageBg = "var(--stage-free)";
  let dotClass = "";

  if (cardState === "moving") {
    statusLabel = "Em uso";
    badgeColor = "var(--info)";
    badgeBg = "var(--info-bg)";
    stageBg = "var(--stage-move)";
    dotClass = "live";
  } else if (cardState === "warn") {
    statusLabel = "Atenção";
    badgeColor = "var(--warning)";
    badgeBg = "var(--warning-bg)";
    stageBg = "var(--stage-warn)";
    dotClass = "live";
  }

  // 3) Nome: Marca + Modelo
  const nameParts = (vehicle.model || "").trim().split(/\s+/);
  const brandName = nameParts[0]?.toUpperCase() || "";
  const modelRest = nameParts.slice(1).join(" ") || brandName;

  // 5) Linha técnica
  const latestInspection = inspections.find((i) => i.vehicleId === vehicle.id);
  const currentOdometer = latestInspection?.odometer || vehicle.odometer;
  const formattedKm = currentOdometer.toLocaleString("pt-BR");

  // 6) Rodapé
  const latestDeparture = inspections.find(
    (i) => i.vehicleId === vehicle.id && i.kind === "departure"
  );
  const activeDriverId =
    latestDeparture?.driverId ||
    (latestInspection?.kind === "departure" ? latestInspection.driverId : vehicle.driver);
  const driver = drivers.find((d) => d.id === activeDriverId);
  const driverFirstName = driver?.name?.split(" ")[0] || "Em atividade";
  const driverInitials =
    driver?.initials ||
    (driver?.name
      ? driver.name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
      : "EM");
  const avatarBg = driver?.color || "var(--surface-2)";

  const departureDate = latestDeparture?.finishedAt || latestDeparture?.startedAt;
  const departureTimeStr = departureDate
    ? `saiu ${new Date(departureDate).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "em uso";

  const openFindings = openVehicleFindings(vehicle.id, inspections);
  const issueTitle = openFindings[0]?.finding?.area || "Manutenção pendente";

  return (
    <article
      className={`vehicle-card rise st-${cardState}`}
      style={{
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* 1) Topo: badge de status e unidade */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            color: badgeColor,
            background: badgeBg,
          }}
        >
          <span
            className={dotClass}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "currentColor",
              color: badgeColor,
              display: "inline-block",
            }}
          />
          {statusLabel}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          <MapPin size={11} strokeWidth={2.2} aria-hidden="true" />
          {shortUnit}
        </span>
      </div>

      {/* 2) Palco do carro */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetail(vehicle)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDetail(vehicle);
          }
        }}
        aria-label={`Detalhes de ${vehicle.model}`}
        style={{
          position: "relative",
          height: 86,
          borderRadius: 14,
          background: stageBg,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {cardState === "free" && (
          <>
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 9,
                height: 14,
                borderLeft: "2px solid var(--success)",
                borderRight: "2px solid var(--success)",
                opacity: 0.45,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 9,
                height: 2,
                background: "var(--success)",
                opacity: 0.45,
              }}
            />
          </>
        )}

        {cardState === "moving" && (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 9,
                height: 2,
                overflow: "hidden",
              }}
            >
              <div
                className="roadline"
                style={{
                  width: "200%",
                  height: 2,
                  background:
                    "repeating-linear-gradient(90deg, var(--info) 0 18px, transparent 18px 36px)",
                  opacity: 0.55,
                }}
              />
            </div>
            <div
              className="gust"
              style={{
                position: "absolute",
                left: 6,
                top: 30,
                width: 26,
                height: 2,
                borderRadius: 2,
                background: "var(--info)",
              }}
            />
            <div
              className="gust g2"
              style={{
                position: "absolute",
                left: 12,
                top: 46,
                width: 18,
                height: 2,
                borderRadius: 2,
                background: "var(--info)",
              }}
            />
          </>
        )}

        {cardState === "warn" && (
          <>
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 9,
                height: 2,
                background: "var(--warning)",
                opacity: 0.35,
              }}
            />
            <div
              className="alert"
              style={{
                position: "absolute",
                right: 22,
                top: 6,
                width: 24,
                height: 24,
                borderRadius: 8,
                background: "var(--warning)",
                color: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 7v6M12 17h.01" />
              </svg>
            </div>
          </>
        )}

        <CarIllustration
          type={vehicle.illustration}
          color={vehicle.color}
          state={cardState}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 6,
            transform: "translateX(-50%)",
            width: 150,
            height: 56,
            display: "block",
          }}
        />
      </div>

      {/* 3) Nome: Marca em maiúsculas e modelo em destaque */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenDetail(vehicle)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDetail(vehicle);
          }
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          minWidth: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".08em",
            color: "var(--muted)",
            textTransform: "uppercase",
          }}
        >
          {brandName}
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            lineHeight: 1.1,
          }}
        >
          {modelRest}
        </span>
      </div>

      {/* 4) Placa Mercosul */}
      <BrPlate plate={vehicle.plate} />

      {/* 5) Linha técnica em mono */}
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--muted)",
          display: "flex",
          flexWrap: "wrap",
          gap: "2px 8px",
        }}
      >
        <span>{formattedKm} km</span>
        <span>
          {vehicle.year} · {vehicle.color}
        </span>
      </div>

      {/* 6) Rodapé conforme estado */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 34,
        }}
      >
        {cardState === "moving" && (
          <>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: avatarBg,
                color: "var(--ink)",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {driverInitials}
            </span>
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {driverFirstName}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              >
                {departureTimeStr}
              </span>
            </span>
          </>
        )}

        {cardState === "free" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartInspection(vehicle);
            }}
            style={{
              flex: 1,
              width: "100%",
              height: 36,
              borderRadius: 11,
              background: "var(--accent)",
              color: "var(--on-accent)",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              border: 0,
              cursor: "pointer",
            }}
          >
            Sair com ele
            <ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}

        {cardState === "warn" && (
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--warning)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {issueTitle}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(vehicle);
              }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
                textDecoration: "none",
                background: "transparent",
                border: 0,
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Ver pendência →
            </button>
          </span>
        )}
      </div>
    </article>
  );
}
