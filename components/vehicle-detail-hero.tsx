"use client";

import React, { useMemo } from "react";
import { MapPin, Gauge, Route, Calendar, AlertTriangle } from "lucide-react";
import {
  type Vehicle,
  type Inspection,
  km,
  getVehicleState,
} from "../lib/model";
import { buildTrips } from "../lib/trips";
import { CarIllustration, BrPlate, Odometer } from "./ui";
import { Badge } from "./common";

export interface VehicleDetailHeroProps {
  vehicle: Vehicle;
  inspections: Inspection[];
  sorted?: Inspection[];
}

export function VehicleDetailHero({
  vehicle,
  inspections,
  sorted = [],
}: VehicleDetailHeroProps) {
  const state = getVehicleState(vehicle, inspections);
  const carState =
    state === "out" ? "moving" : state === "attention" ? "warn" : "free";

  // Indicador 1: Km atual
  const currentKm =
    sorted.find((i) => i.vehicleId === vehicle.id)?.odometer ||
    vehicle.odometer;

  // Indicadores 2 e 3: Utilizações e Km no mês
  const { tripCount, monthKm } = useMemo(() => {
    const allTrips = buildTrips(inspections).filter(
      (t) => t.vehicleId === vehicle.id
    );
    const count = allTrips.length;

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const currentMonthTrips = allTrips.filter((t) => {
      const dt = t.departure?.finishedAt || t.returned?.finishedAt;
      if (!dt) return false;
      const d = new Date(dt);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const sumMonth = currentMonthTrips.reduce(
      (acc, t) => acc + (t.distance || 0),
      0
    );
    const fallbackSum = allTrips.reduce((acc, t) => acc + (t.distance || 0), 0);

    return {
      tripCount: count,
      monthKm: sumMonth > 0 ? sumMonth : fallbackSum,
    };
  }, [inspections, vehicle.id]);

  const brand = vehicle.model.split(" ")[0]?.toUpperCase() || "VEÍCULO";

  return (
    <div className="vehicle-detail-hero-v2">
      {/* 1) Palco grande (altura 180px) com CarIllustration no estado atual */}
      <div className={`vehicle-detail-stage ${carState}`}>
        {carState === "moving" && (
          <>
            <div className="vehicle-stage-wind" aria-hidden="true" />
            <div className="vehicle-stage-road" aria-hidden="true" />
          </>
        )}
        {carState === "free" && (
          <div className="vehicle-stage-bay" aria-hidden="true">
            <span className="bay-line" />
            <span className="bay-corner left" />
            <span className="bay-corner right" />
          </div>
        )}
        {carState === "warn" && (
          <div className="vehicle-stage-warn-badge" aria-label="Veículo com pendência">
            <AlertTriangle size={18} />
          </div>
        )}
        <div className="vehicle-detail-car-wrap">
          <CarIllustration type={vehicle.illustration} state={carState} />
        </div>
      </div>

      {/* Identidade do veículo */}
      <div className="vehicle-detail-header-info">
        <div className="vehicle-detail-brand-row">
          <span className="vehicle-detail-brand">{brand}</span>
          <div className="vehicle-detail-meta-pills">
            <span className="vehicle-detail-unit">
              <MapPin size={12} />
              {vehicle.unit.replace(/^Unidade\s+/i, "")}
            </span>
            <Badge state={state} />
          </div>
        </div>

        <h2 className="vehicle-detail-model">{vehicle.model}</h2>

        {/* Placa Mercosul LG */}
        <div className="vehicle-detail-plate-wrap">
          <BrPlate plate={vehicle.plate} size="lg" />
        </div>
      </div>

      {/* Indicadores em Odometer: km atual, utilizações, km no mês */}
      <div className="vehicle-detail-odometers">
        <div className="v-odometer-card">
          <div className="v-odometer-label">
            <Gauge size={14} />
            <span>KM ATUAL</span>
          </div>
          <div className="v-odometer-value-wrap">
            <Odometer value={currentKm} />
            <span className="v-odometer-unit">km</span>
          </div>
        </div>

        <div className="v-odometer-card">
          <div className="v-odometer-label">
            <Route size={14} />
            <span>UTILIZAÇÕES</span>
          </div>
          <div className="v-odometer-value-wrap">
            <Odometer value={tripCount} />
            <span className="v-odometer-unit">viagens</span>
          </div>
        </div>

        <div className="v-odometer-card">
          <div className="v-odometer-label">
            <Calendar size={14} />
            <span>KM NO MÊS</span>
          </div>
          <div className="v-odometer-value-wrap">
            <Odometer value={monthKm} />
            <span className="v-odometer-unit">km</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleDetailHero;
