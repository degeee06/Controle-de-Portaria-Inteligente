export interface Driver {
  id: string;
  name: string;
}

export type VehicleStatus = 'DISPONIVEL' | 'EM_USO';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: VehicleStatus;
}

export type MovementType = 'SAIDA' | 'CHEGADA';

export interface Movement {
  id: string;
  vehicleId: string;
  driverId: string;
  timestamp: Date;
  km: number;
  type: MovementType;
  destination?: string; // Optional, only for 'SAIDA'
}

export interface CompletedMovementData {
  vehicleId: string;
  driverIdOut: string;
  timestampOut: Date;
  kmOut: number;
  destination: string;
  driverIdIn: string;
  timestampIn: Date;
  kmIn: number;
}

// FIX: Added missing types for Log, LogStatus, and ManualLogData
// These are used by legacy or mock components that haven't been fully refactored to use the Movement type.
export type LogStatus = 'out' | 'completed';

export interface Log {
  id: string;
  vehicleId: string;
  driverIdOut: string;
  timestampOut: Date;
  kmOut: number;
  destination: string;
  status: LogStatus;
  driverIdIn?: string;
  timestampIn?: Date;
  kmIn?: number;
}

export interface ManualLogData {
  vehicleId: string;
  driverIdOut: string;
  timestampOut: Date;
  kmOut: number;
  destination: string;
  driverIdIn: string;
  timestampIn: Date;
  kmIn: number;
}