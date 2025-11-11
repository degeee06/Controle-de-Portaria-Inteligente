
import type { Vehicle, Driver, Log, VehicleStatus } from '../types';

// --- Mock Data ---
let mockDrivers: Driver[] = [
  { id: 'd1', name: 'João Silva' },
  { id: 'd2', name: 'Maria Oliveira' },
  { id: 'd3', name: 'Carlos Pereira' },
];

// FIX: Added the required 'status' property to all vehicle objects.
let mockVehicles: Vehicle[] = [
  { id: 'v1', plate: 'ABC-1234', model: 'Ford Ranger', status: 'DISPONIVEL' },
  { id: 'v2', plate: 'XYZ-5678', model: 'Fiat Strada', status: 'EM_USO' },
  { id: 'v3', plate: 'QWE-9101', model: 'Toyota Hilux', status: 'DISPONIVEL' },
  { id: 'v4', plate: 'RTY-1121', model: 'Chevrolet S10', status: 'DISPONIVEL' },
];

let mockLogs: Log[] = [
    {
        id: 'l1',
        vehicleId: 'v2',
        driverIdOut: 'd2',
        timestampOut: new Date(new Date().setDate(new Date().getDate() - 1)),
        kmOut: 15000,
        destination: 'Cliente A',
        status: 'out',
    }
];

// --- Mock API Functions ---
const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getVehicles = async (): Promise<Vehicle[]> => {
  await simulateDelay(500);
  return [...mockVehicles];
};

export const getDrivers = async (): Promise<Driver[]> => {
  await simulateDelay(500);
  return [...mockDrivers];
};

export const getLogs = async (): Promise<Log[]> => {
  await simulateDelay(500);
  return [...mockLogs];
};

export const addVehicleAndDriver = async (plate: string, model: string, driverName: string): Promise<{vehicle: Vehicle, driver: Driver}> => {
  await simulateDelay(300);
  let driver = mockDrivers.find(d => d.name.toLowerCase() === driverName.toLowerCase());
  if (!driver) {
    driver = { id: `d${Date.now()}`, name: driverName };
    mockDrivers.push(driver);
  }
  // FIX: Added the required 'status' property for new vehicles.
  const newVehicle: Vehicle = {
    id: `v${Date.now()}`,
    plate,
    model,
    status: 'DISPONIVEL',
  };
  mockVehicles.push(newVehicle);
  return { vehicle: newVehicle, driver };
};

export const createLog = async (vehicle: Vehicle, kmOut: number, destination: string): Promise<Log> => {
    await simulateDelay(300);
    const newLog: Log = {
        id: `l${Date.now()}`,
        vehicleId: vehicle.id,
        // The property 'driverId' does not exist on type 'Vehicle'. Hardcoding a mock driver ID for this mock function.
        driverIdOut: 'd1',
        timestampOut: new Date(),
        kmOut,
        destination,
        status: 'out',
    };
    mockLogs.push(newLog);
    return newLog;
};

export const updateLog = async (logId: string, kmIn: number): Promise<Log> => {
    await simulateDelay(300);
    const logIndex = mockLogs.findIndex(l => l.id === logId);
    if (logIndex === -1) {
        throw new Error("Log not found");
    }
    const updatedLog: Log = {
        ...mockLogs[logIndex],
        kmIn,
        timestampIn: new Date(),
        // The LogStatus type is 'completed' for a finished log.
        status: 'completed',
    };
    mockLogs[logIndex] = updatedLog;
    return updatedLog;
}
