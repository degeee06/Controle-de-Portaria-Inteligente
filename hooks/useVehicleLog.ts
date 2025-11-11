import { useState, useEffect, useCallback } from 'react';
import type { Vehicle, Driver, Movement, CompletedMovementData } from '../types';
import * as storage from '../services/offlineStorageService';

export const useVehicleLog = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    try {
      setLoading(true);
      const vehiclesData = storage.getVehicles();
      const driversData = storage.getDrivers();
      const movementsData = storage.getMovements().map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setMovements(movementsData);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar os dados do armazenamento local.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addDriver = useCallback(async (driverName: string): Promise<Driver> => {
    try {
        const newDriver = storage.addDriver(driverName);
        setDrivers(prev => [...prev, newDriver]);
        return newDriver;
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Falha ao adicionar motorista.');
    }
  }, []);

  const addVehicle = useCallback(async (plate: string, model: string) => {
    try {
      const newVehicle = storage.addVehicle(plate, model);
      setVehicles(prev => [...prev, newVehicle]);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(`Falha ao adicionar veículo: ${err.message}`);
        throw err;
      }
      setError('Falha ao adicionar veículo.');
      throw new Error('Falha ao adicionar veículo.');
    }
  }, []);
  
  const updateVehicleInState = (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  }

  const registerSaida = useCallback(async (vehicleId: string, driverId: string, km: number, destination: string) => {
    try {
      const { newMovement, updatedVehicle } = storage.registerSaida(vehicleId, driverId, km, destination);
      setMovements(prev => [...prev, newMovement]);
      updateVehicleInState(updatedVehicle);
    } catch (err) {
      console.error(err);
      setError('Falha ao registrar saída.');
    }
  }, []);

  const registerChegada = useCallback(async (vehicleId: string, driverId: string, km: number) => {
    try {
      const { newMovement, updatedVehicle } = storage.registerChegada(vehicleId, driverId, km);
      setMovements(prev => [...prev, newMovement]);
      updateVehicleInState(updatedVehicle);
    } catch (err) {
      console.error(err);
      setError('Falha ao registrar chegada.');
    }
  }, []);

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    try {
        storage.deleteVehicle(vehicleId);
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Falha ao excluir veículo.');
        }
    }
  }, []);

  const deleteMovement = useCallback(async (movementId: string) => {
    try {
        storage.deleteMovement(movementId);
        setMovements(prev => prev.filter(m => m.id !== movementId));
    } catch (err) {
        console.error(err);
        setError('Falha ao excluir registro de movimento.');
    }
  }, []);

  const importBackup = useCallback((jsonString: string) => {
    try {
        storage.importAllData(jsonString);
    } catch (err) {
        console.error("Failed to import data:", err);
        if (err instanceof Error) {
            throw new Error(`Falha ao importar dados: ${err.message}`);
        }
        throw new Error("Falha ao importar dados: Erro desconhecido");
    }
  }, []);

  return { vehicles, drivers, movements, loading, error, addVehicle, addDriver, registerSaida, registerChegada, deleteVehicle, deleteMovement, importBackup, fetchData };
};
