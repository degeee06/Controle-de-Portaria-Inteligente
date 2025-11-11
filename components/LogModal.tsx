import React, { useState, useEffect } from 'react';
import type { Vehicle, Log, Driver } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import * as storage from '../services/offlineStorageService';


interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  log: Log | null;
  drivers: Driver[];
  onLogExit: (vehicleId: string, driverIdOut: string, kmOut: number, destination: string) => Promise<void>;
  onLogEntry: (log: Log, kmIn: number, driverIdIn: string, destination: string) => Promise<void>;
}

const formatDateTime = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, vehicle, log, drivers, onLogExit, onLogEntry }) => {
  const [km, setKm] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commonDestinations, setCommonDestinations] = useState<string[]>([]);
  const [isAddingDestination, setIsAddingDestination] = useState(false);
  const [newDestinationInput, setNewDestinationInput] = useState('');
  const [departingDriverId, setDepartingDriverId] = useState<string>('');
  const [returningDriverId, setReturningDriverId] = useState<string>('');
  
  const isExit = !log;
  const outboundDriver = drivers.find(d => d.id === log?.driverIdOut);

  useEffect(() => {
    if (isOpen) {
      setCommonDestinations(storage.getCommonDestinations());
    } else {
      // Reset state when modal closes
      setIsAddingDestination(false);
      setNewDestinationInput('');
      setDestination('');
      setKm('');
      setError('');
      setDepartingDriverId('');
      setReturningDriverId('');
    }
  }, [isOpen]);

  const handleAddNewDestination = () => {
    if (newDestinationInput.trim()) {
      const updatedDestinations = storage.addCommonDestination(newDestinationInput);
      setCommonDestinations(updatedDestinations);
      setDestination(newDestinationInput.trim()); // Auto-select the new destination
      setNewDestinationInput('');
      setIsAddingDestination(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kmNumber = parseInt(km, 10);

    if (isNaN(kmNumber) || kmNumber < 0) {
      setError('Por favor, insira uma quilometragem válida.');
      return;
    }

    if (isExit) {
        if (!departingDriverId) {
            setError('Por favor, selecione o motorista.');
            return;
        }
        if (!destination) {
          setError('Por favor, selecione ou insira um destino.');
          return;
        }
    }


    if (!isExit && !returningDriverId) {
        setError('Por favor, selecione o motorista que está retornando.');
        return;
    }

    // Smart validation: only enforce kmIn > kmOut on the same day
    if (!isExit && log) {
        const today = new Date();
        const departureDate = new Date(log.timestampOut);
        const isSameDay = today.getFullYear() === departureDate.getFullYear() &&
                          today.getMonth() === departureDate.getMonth() &&
                          today.getDate() === departureDate.getDate();

        if (isSameDay && kmNumber < log.kmOut) {
            setError('A KM de chegada não pode ser menor que a de saída para viagens no mesmo dia.');
            return;
        }
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      if (isExit) {
        await onLogExit(vehicle.id, departingDriverId, kmNumber, destination);
      } else if (log) {
        await onLogEntry(log, kmNumber, returningDriverId, 'Sistema Interno');
      }
      onClose();
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary">
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-brand-text-primary">
          {isExit ? 'Registrar Saída' : 'Registrar Chegada'}
        </h2>
        <p className="text-brand-text-secondary mb-6">{vehicle.model} - {vehicle.plate}</p>
        
        {!isExit && log && (
            <div className="bg-brand-primary p-3 rounded-lg mb-6 border border-gray-700">
                <h3 className="font-semibold text-brand-text-primary mb-2">Detalhes da Saída</h3>
                 <p className="text-sm text-brand-text-secondary">
                    <strong>Motorista (Saída):</strong> {outboundDriver?.name || 'N/A'}
                </p>
                <p className="text-sm text-brand-text-secondary">
                    <strong>Horário de Saída:</strong> {formatDateTime(log.timestampOut)}
                </p>
                <p className="text-sm text-brand-text-secondary">
                    <strong>KM de Saída:</strong> {log.kmOut.toLocaleString('pt-BR')} km
                </p>
            </div>
        )}

        <form onSubmit={handleSubmit}>
          {isExit && (
            <>
              <div className="mb-4">
                  <label htmlFor="departingDriver" className="block text-sm font-medium text-brand-text-secondary mb-2">
                      Motorista (Saída)
                  </label>
                  <select
                      id="departingDriver"
                      value={departingDriverId}
                      onChange={(e) => setDepartingDriverId(e.target.value)}
                      className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      required
                  >
                      <option value="" disabled>Selecione um motorista</option>
                      {drivers.sort((a,b) => a.name.localeCompare(b.name)).map(driver => (
                          <option key={driver.id} value={driver.id}>
                              {driver.name}
                          </option>
                      ))}
                  </select>
              </div>
              <div className="mb-4">
                <label htmlFor="destination" className="block text-sm font-medium text-brand-text-secondary mb-2">Destino</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                  {commonDestinations.map(d => (
                    <button type="button" key={d} onClick={() => setDestination(d)} className={`text-sm py-2 px-1 rounded-md transition-colors ${destination === d ? 'bg-brand-accent text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      {d}
                    </button>
                  ))}
                  {!isAddingDestination && (
                    <button 
                        type="button" 
                        onClick={() => setIsAddingDestination(true)} 
                        className="text-sm py-2 px-1 rounded-md transition-colors border-2 border-dashed border-gray-600 text-brand-text-secondary hover:bg-gray-700 hover:border-gray-500 flex items-center justify-center"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Adicionar
                    </button>
                  )}
                </div>
                
                {isAddingDestination && (
                  <div className="flex items-center gap-2 mb-3 mt-3">
                      <input
                          type="text"
                          value={newDestinationInput}
                          onChange={(e) => setNewDestinationInput(e.target.value)}
                          placeholder="Nome do novo destino"
                          className="flex-grow bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          autoFocus
                          onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddNewDestination(); }}}
                      />
                      <button 
                          type="button" 
                          onClick={handleAddNewDestination} 
                          className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-3 rounded-lg transition-colors"
                      >
                          Salvar
                      </button>
                      <button 
                          type="button" 
                          onClick={() => setIsAddingDestination(false)} 
                          className="p-2 text-brand-text-secondary hover:bg-gray-700 rounded-full"
                          aria-label="Cancelar"
                      >
                          <XMarkIcon className="h-5 w-5" />
                      </button>
                  </div>
                )}

                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ou digite um destino"
                  className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  required
                />
              </div>
            </>
          )}

          <div className="mb-4">
             <label htmlFor="km" className="block text-sm font-medium text-brand-text-secondary mb-2">
                Quilometragem {isExit ? 'de Saída' : 'de Chegada'}
            </label>
            <input
              id="km"
              type="number"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="Ex: 123456"
              className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              required
            />
          </div>

          {!isExit && (
              <div className="mb-4">
                  <label htmlFor="returningDriver" className="block text-sm font-medium text-brand-text-secondary mb-2">
                      Motorista (Chegada)
                  </label>
                  <select
                      id="returningDriver"
                      value={returningDriverId}
                      onChange={(e) => setReturningDriverId(e.target.value)}
                      className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      required
                  >
                      <option value="" disabled>Selecione um motorista</option>
                      {drivers.sort((a,b) => a.name.localeCompare(b.name)).map(driver => (
                          <option key={driver.id} value={driver.id}>
                              {driver.name}
                          </option>
                      ))}
                  </select>
              </div>
          )}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : `Confirmar ${isExit ? 'Saída' : 'Chegada'}`}
          </button>
        </form>
      </div>
    </div>
  );
};