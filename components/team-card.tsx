import React from "react";
import { ArrowRight } from "lucide-react";
import type { Driver, Vehicle } from "../lib/model";
import { BrPlate, LiveDot, Odometer } from "./ui";
import { Avatar } from "./common";

export interface TeamCardProps {
  driver: Driver;
  activeVehicle?: Vehicle;
  inspectionsCount: number;
  index?: number;
  onViewHistory: () => void;
}

export function TeamCard({
  driver,
  activeVehicle,
  inspectionsCount,
  index = 0,
  onViewHistory,
}: TeamCardProps) {
  const isWithCar = Boolean(activeVehicle);

  return (
    <article
      className="team-card rise"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="team-card-top">
        <div className="team-card-person">
          <div
            className={`team-avatar-ring ${isWithCar ? "status-active" : "status-free"}`}
            title={isWithCar ? `Com o ${activeVehicle?.model}` : "Disponível"}
          >
            <Avatar driver={driver} />
          </div>
          <div className="team-card-id">
            <strong className="team-driver-name">{driver.name}</strong>
            <span className="team-driver-role">{driver.role}</span>
          </div>
        </div>

        <div className="team-card-status-col">
          {isWithCar && activeVehicle ? (
            <div className="team-status-active">
              <div className="team-status-pill">
                <LiveDot color="var(--info)" />
                <span className="team-status-label">Com o {activeVehicle.model}</span>
              </div>
              <div className="team-plate-scale">
                <BrPlate plate={activeVehicle.plate} size="sm" />
              </div>
            </div>
          ) : (
            <div className="team-status-free">
              <span className="team-free-badge">
                <LiveDot color="var(--success)" />
                <span>Disponível</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="team-card-bottom">
        <div className="team-card-stat">
          <span className="team-stat-count">
            <Odometer value={inspectionsCount} />
          </span>
          <span className="team-stat-label">Vistorias registradas</span>
        </div>

        <button
          type="button"
          className="text-button team-history-link"
          onClick={onViewHistory}
        >
          Ver histórico <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

export default TeamCard;
