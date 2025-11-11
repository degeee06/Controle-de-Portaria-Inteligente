import type { Vehicle, Driver, Movement, VehicleStatus, MovementType, CompletedMovementData } from '../types';

// --- Helper functions for localStorage ---
const getData = <T>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const setData = <T>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};


// --- Initial Mock Data (used only if localStorage is empty) ---
const initialDrivers: Driver[] = [
    { id: 'd_1', name: 'Jose Carlos' },
    { id: 'd_2', name: 'Eduardo' },
    { id: 'd_3', name: 'Rogerio' },
    { id: 'd_4', name: 'Neumar' },
    { id: 'd_5', name: 'Tiago' },
    { id: 'd_6', name: 'Lucas' },
    { id: 'd_7', name: 'Alex' },
    { id: 'd_8', name: 'Gelson' },
    { id: 'd_9', name: 'Peterson' },
    { id: 'd_10', name: 'Pedro' },
    { id: 'd_11', name: 'Marcos' },
    { id: 'd_12', name: 'Iberê' },
    { id: 'd_13', name: 'Vilmar' },
    { id: 'd_14', name: 'Querivelto' },
    { id: 'd_15', name: 'Umberto' },
    { id: 'd_16', name: 'Cleomar' },
    { id: 'd_17', name: 'Mathias' },
    { id: 'd_18', name: 'Douglas' },
    { id: 'd_19', name: 'Carlos' },
    { id: 'd_20', name: 'Fabrício' },
    { id: 'd_21', name: 'Jackson' },
    { id: 'd_22', name: 'José' },
];

const initialVehicles: Vehicle[] = [
    { id: 'v_JBR5F82', plate: 'JBR5F82', model: 'GOL', status: 'DISPONIVEL' },
    { id: 'v_JBA9I15', plate: 'JBA9I15', model: 'GOL', status: 'DISPONIVEL' },
    { id: 'v_IVX5841', plate: 'IVX5841', model: 'GOL', status: 'DISPONIVEL' },
    { id: 'v_IXZ8235', plate: 'IXZ8235', model: 'SAVEIRO', status: 'DISPONIVEL' },
    { id: 'v_JQP6H92', plate: 'JQP6H92', model: 'HR-NOVA', status: 'DISPONIVEL' },
    { id: 'v_IZI2D19', plate: 'IZI2D19', model: 'SAVEIRO', status: 'DISPONIVEL' },
    { id: 'v_IXR5497', plate: 'IXR5497', model: 'GOL', status: 'DISPONIVEL' },
    { id: 'v_INL4G00', plate: 'INL4G00', model: 'CAÇAMBA', status: 'DISPONIVEL' },
    { id: 'v_ITG8844', plate: 'ITG8844', model: 'HR', status: 'DISPONIVEL' },
];

const initialMovements: Movement[] = [];

const initialCommonDestinations: string[] = [];

// --- Initialize with mock data if localStorage is empty ---
const initializeData = () => {
    if (!localStorage.getItem('drivers')) {
        setData<Driver[]>('drivers', initialDrivers);
    }
    if (!localStorage.getItem('vehicles')) {
        setData<Vehicle[]>('vehicles', initialVehicles);
    }
    if (!localStorage.getItem('movements')) {
        setData<Movement[]>('movements', initialMovements);
    }
    if (!localStorage.getItem('commonDestinations')) {
        setData<string[]>('commonDestinations', initialCommonDestinations);
    }
};

initializeData();

// --- Data Access Functions ---

export const getVehicles = (): Vehicle[] => {
  return getData<Vehicle[]>('vehicles', []);
};

export const getDrivers = (): Driver[] => {
  return getData<Driver[]>('drivers', []);
};

export const getMovements = (): Movement[] => {
  return getData<Movement[]>('movements', []);
};

export const getCommonDestinations = (): string[] => {
    return getData<string[]>('commonDestinations', []);
};

export const addCommonDestination = (destination: string): string[] => {
    const destinations = getCommonDestinations();
    if (destination.trim() && !destinations.some(d => d.toLowerCase() === destination.toLowerCase())) {
        const updatedDestinations = [...destinations, destination.trim()];
        setData<string[]>('commonDestinations', updatedDestinations);
        return updatedDestinations;
    }
    return destinations;
};

export const addDriver = (driverName: string): Driver => {
    const drivers = getDrivers();
    const trimmedName = driverName.trim();
    if (!trimmedName) {
        throw new Error("O nome do motorista não pode ser vazio.");
    }
    if (drivers.some(d => d.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error("Motorista com este nome já existe.");
    }
    const newDriver: Driver = { id: `d${Date.now()}`, name: trimmedName };
    setData<Driver[]>('drivers', [...drivers, newDriver]);
    return newDriver;
}

export const addVehicle = (plate: string, model: string): Vehicle => {
    const vehicles = getVehicles();
    if (vehicles.some(v => v.plate.toUpperCase() === plate.toUpperCase().trim())) {
        throw new Error("Veículo com esta placa já existe.");
    }

    const newVehicle: Vehicle = {
        id: `v${Date.now()}`,
        plate: plate.trim().toUpperCase(),
        model: model.trim(),
        status: 'DISPONIVEL',
    };
    
    setData<Vehicle[]>('vehicles', [...vehicles, newVehicle]);
    return newVehicle;
};

export const deleteVehicle = (vehicleId: string): void => {
    let vehicles = getVehicles();
    let movements = getMovements();
    
    // Disallow deleting a vehicle that is currently out
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && vehicle.status === 'EM_USO') {
        throw new Error("Não é possível excluir um veículo que está em viagem.");
    }
    
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    // Optional: also delete movements associated with the vehicle, or keep for history
    // For now, we keep the movements for historical integrity
    setData<Vehicle[]>('vehicles', updatedVehicles);
};


const updateVehicleStatus = (vehicleId: string, status: VehicleStatus): Vehicle => {
    const vehicles = getVehicles();
    const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) throw new Error("Veículo não encontrado.");

    const updatedVehicle = { ...vehicles[vehicleIndex], status };
    const updatedVehicles = [...vehicles];
    updatedVehicles[vehicleIndex] = updatedVehicle;
    setData<Vehicle[]>('vehicles', updatedVehicles);
    return updatedVehicle;
};

export const registerSaida = (vehicleId: string, driverId: string, km: number, destination: string): {newMovement: Movement, updatedVehicle: Vehicle} => {
    const movements = getMovements();
    const newMovement: Movement = {
        id: `m${Date.now()}`,
        vehicleId,
        driverId,
        timestamp: new Date(),
        km,
        destination,
        type: 'SAIDA',
    };
    setData<Movement[]>('movements', [...movements, newMovement]);

    const updatedVehicle = updateVehicleStatus(vehicleId, 'EM_USO');
    
    return { newMovement, updatedVehicle };
};

export const registerChegada = (vehicleId: string, driverId: string, km: number): {newMovement: Movement, updatedVehicle: Vehicle} => {
    const movements = getMovements();
    const newMovement: Movement = {
        id: `m${Date.now()}`,
        vehicleId,
        driverId,
        timestamp: new Date(),
        km,
        type: 'CHEGADA',
    };
    setData<Movement[]>('movements', [...movements, newMovement]);

    const updatedVehicle = updateVehicleStatus(vehicleId, 'DISPONIVEL');

    return { newMovement, updatedVehicle };
};

export const deleteMovement = (movementId: string): void => {
    let movements = getMovements();
    const updatedMovements = movements.filter(m => m.id !== movementId);
    setData<Movement[]>('movements', updatedMovements);
};


// --- Backup and Restore Functions ---
export const exportAllData = () => {
    const dataToExport = {
        vehicles: getVehicles(),
        drivers: getDrivers(),
        movements: getMovements(),
        commonDestinations: getCommonDestinations(),
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_controle_portaria_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const importAllData = (jsonString: string) => {
    try {
        const data = JSON.parse(jsonString);
        // Adjusted to new schema
        if (data && typeof data === 'object' && 'vehicles' in data && 'drivers' in data && ('logs' in data || 'movements' in data) && 'commonDestinations' in data) {
            setData('vehicles', data.vehicles);
            setData('drivers', data.drivers);
            // Handle importing old 'logs' format or new 'movements' format
            setData('movements', data.movements || data.logs); 
            setData('commonDestinations', data.commonDestinations);
        } else {
            throw new Error('Formato de arquivo de backup inválido.');
        }
    } catch (e) {
        if (e instanceof SyntaxError) {
            throw new Error('Arquivo de backup inválido. O arquivo não é um JSON válido.');
        }
        if (e instanceof Error) {
           throw e;
        }
        throw new Error('Ocorreu um erro desconhecido ao processar o backup.');
    }
};
