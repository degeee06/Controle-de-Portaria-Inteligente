import React, { useState, useEffect } from 'react';
import type { Vehicle, Driver, Movement } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import * as storage from '../services/offlineStorageService';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ArrowRightOnRectangleIcon } from './icons/ArrowRightOnRectangleIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';


interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'SAIDA' | 'CHEGADA';
  vehicles: Vehicle[];
  drivers: Driver[];
  movements: Movement[];
  lastDepartureMovementsMap: Map<string, Movement>;
  onRegisterSaida: (vehicleId: string, driverId: string, km: number, destination: string) => Promise<void>;
  onRegisterChegada: (vehicleId: string, driverId: string, km: number) => Promise<void>;
  onAddDriver: (driverName: string) => Promise<Driver>;
}

interface CompletedTrip {
    vehicle: Vehicle;
    departure: Movement;
    arrival: {
        driver: Driver;
        timestamp: Date;
        km: number;
    }
}

const initialFormData = {
    km: '',
    driverId: '',
    destination: '',
};

const formatDateTime = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const calculateDuration = (start: Date, end: Date): string => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return 'N/A';

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    let durationString = '';
    if (days > 0) durationString += `${days}d `;
    if (hours > 0) durationString += `${hours}h `;
    if (minutes >= 0 && durationString === '' && days === 0) durationString += `${minutes}m`;
    
    return durationString.trim() || '0m';
}

export const MovementModal: React.FC<MovementModalProps> = ({ isOpen, onClose, mode, vehicles, drivers, movements, lastDepartureMovementsMap, onRegisterSaida, onRegisterChegada, onAddDriver }) => {
  const [view, setView] = useState<'form' | 'success'>('form');
  const [completedTrip, setCompletedTrip] = useState<CompletedTrip | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commonDestinations, setCommonDestinations] = useState<string[]>([]);

  const [isAddingDestination, setIsAddingDestination] = useState(false);
  const [newDestinationInput, setNewDestinationInput] = useState('');

  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [addDriverError, setAddDriverError] = useState('');
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);

  const isSaida = mode === 'SAIDA';
  
  useEffect(() => {
    if (isOpen) {
      setCommonDestinations(storage.getCommonDestinations());
    } else {
      // Reset state when modal closes
      setSelectedVehicleId('');
      setFormData(initialFormData);
      setError('');
      setIsSubmitting(false);
      setIsAddingDestination(false);
      setNewDestinationInput('');
      setView('form');
      setCompletedTrip(null);
      setIsAddingDriver(false);
      setNewDriverName('');
      setAddDriverError('');
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value }));
  };
  
  const handleAddNewDestination = () => {
    if (newDestinationInput.trim()) {
      const updatedDestinations = storage.addCommonDestination(newDestinationInput);
      setCommonDestinations(updatedDestinations);
      setFormData(p => ({...p, destination: newDestinationInput.trim()}));
      setNewDestinationInput('');
      setIsAddingDestination(false);
    }
  };
  
  const handleAddDriver = async () => {
    if (!newDriverName.trim()) {
        setAddDriverError('O nome do motorista é obrigatório.');
        return;
    }
    setAddDriverError('');
    setIsSubmittingDriver(true);
    try {
        const newDriver = await onAddDriver(newDriverName);
        setFormData(prev => ({ ...prev, driverId: newDriver.id })); // Auto-select new driver
        setNewDriverName('');
        setIsAddingDriver(false);
    } catch (err) {
        if (err instanceof Error) {
            setAddDriverError(err.message);
        } else {
            setAddDriverError('Falha ao adicionar motorista.');
        }
    } finally {
        setIsSubmittingDriver(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) {
        setError('Por favor, selecione um veículo válido.');
        return;
    }

    const kmNumber = parseInt(formData.km, 10);
    if (isNaN(kmNumber) || kmNumber < 0) {
      setError('Por favor, insira uma quilometragem válida.');
      return;
    }

    if (!isSaida) { // Chegada mode KM validation
        const lastDeparture = lastDepartureMovementsMap.get(selectedVehicleId);
        if (lastDeparture) {
            const arrivalDate = new Date();
            const departureDate = new Date(lastDeparture.timestamp);
            const isSameDay = arrivalDate.getFullYear() === departureDate.getFullYear() &&
                              arrivalDate.getMonth() === departureDate.getMonth() &&
                              arrivalDate.getDate() === departureDate.getDate();
            
            if (isSameDay && kmNumber < lastDeparture.km) {
                setError(`A KM de chegada (${kmNumber.toLocaleString('pt-BR')}) não pode ser menor que a de saída (${lastDeparture.km.toLocaleString('pt-BR')}) para viagens no mesmo dia.`);
                return;
            }
        }
    }
    
    const driver = drivers.find(d => d.id === formData.driverId);
    if (!driver) {
      setError('Por favor, selecione o motorista.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSaida) {
        if (!formData.destination) {
          throw new Error('Por favor, selecione ou adicione um novo destino.');
        }
        await onRegisterSaida(selectedVehicleId, formData.driverId, kmNumber, formData.destination);
        onClose();
      } else { // CHEGADA mode
        await onRegisterChegada(selectedVehicleId, formData.driverId, kmNumber);
        const departureMovement = lastDepartureMovementsMap.get(selectedVehicleId);
        if (departureMovement) {
            setCompletedTrip({
                vehicle: vehicle,
                departure: departureMovement,
                arrival: {
                    driver: driver,
                    km: kmNumber,
                    timestamp: new Date()
                }
            });
            setView('success');
        } else {
            onClose(); // Fallback if something is wrong
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
      setIsSubmitting(false);
    } 
  };
  
  if (!isOpen) return null;
  
  const title = isSaida ? 'Registrar Saída' : 'Registrar Chegada';

  const renderSuccessView = () => {
      if (!completedTrip) return null;

      const { vehicle, departure, arrival } = completedTrip;
      const departureDriver = drivers.find(d => d.id === departure.driverId);
      const distance = arrival.km - departure.km;
      const duration = calculateDuration(departure.timestamp, arrival.timestamp);
      
      return (
        <div className="flex flex-col items-center text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-brand-text-primary">Chegada Registrada!</h2>
            <p className="text-brand-text-secondary mb-6">Resumo da viagem para o veículo <span className="font-semibold text-brand-text-primary">{vehicle.plate} - {vehicle.model}</span>.</p>

            <div className="w-full text-left bg-brand-primary p-4 rounded-lg border border-gray-700 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold text-red-400 mb-2 flex items-center"><ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" /> Detalhes da Saída</h3>
                        <p className="text-sm"><strong className="text-brand-text-secondary">Motorista:</strong> {departureDriver?.name || 'N/A'}</p>
                        <p className="text-sm"><strong className="text-brand-text-secondary">Horário:</strong> {formatDateTime(departure.timestamp)}</p>
                        <p className="text-sm"><strong className="text-brand-text-secondary">KM:</strong> {departure.km.toLocaleString('pt-BR')}</p>
                        <p className="text-sm"><strong className="text-brand-text-secondary">Destino:</strong> {departure.destination}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-400 mb-2 flex items-center"><ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" /> Detalhes da Chegada</h3>
                        <p className="text-sm"><strong className="text-brand-text-secondary">Motorista:</strong> {arrival.driver.name}</p>
                        <p className="text-sm"><strong className="text-brand-text-secondary">Horário:</strong> {formatDateTime(arrival.timestamp)}</p>
                        <p className="text-sm"><strong className="text-brand-text-secondary">KM:</strong> {arrival.km.toLocaleString('pt-BR')}</p>
                    </div>
                </div>
                 <div className="border-t border-gray-600 my-3"></div>
                 <div className="flex justify-around">
                     <div>
                        <p className="text-sm text-brand-text-secondary">Distância Percorrida</p>
                        <p className="font-bold text-lg text-brand-accent">{distance >= 0 ? `${distance.toLocaleString('pt-BR')} km` : 'N/A'}</p>
                     </div>
                     <div>
                        <p className="text-sm text-brand-text-secondary">Duração da Viagem</p>
                        <p className="font-bold text-lg text-brand-accent">{duration}</p>
                     </div>
                 </div>
            </div>
            
            <button onClick={onClose} className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-lg transition-colors mt-6">
                OK
            </button>
        </div>
      );
  }

  const vehiclesToShow = [...vehicles].sort((a,b) => a.plate.localeCompare(b.plate));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[90vh] flex flex-col">
        {view === 'success' ? renderSuccessView() : (
            <>
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-brand-text-primary">{title}</h2>
                <form onSubmit={handleSubmit} className="overflow-y-auto pr-2 space-y-4">
                     <div>
                        <label htmlFor="vehicleId" className="block text-sm font-medium text-brand-text-secondary mb-2">Veículo</label>
                        <select
                            id="vehicleId"
                            name="vehicleId"
                            value={selectedVehicleId}
                            onChange={(e) => {
                                setSelectedVehicleId(e.target.value);
                                setError('');
                            }}
                            className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            required
                        >
                             <option value="" disabled>Selecione um veículo</option>
                            {vehiclesToShow.map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.plate} - {vehicle.model}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="driverId" className="block text-sm font-medium text-brand-text-secondary">
                            Motorista
                        </label>
                        {!isAddingDriver && (
                            <button
                                type="button"
                                onClick={() => { setIsAddingDriver(true); setAddDriverError(''); }}
                                className="flex items-center text-sm text-brand-accent hover:text-brand-accent-hover font-medium p-1 -mr-1"
                                aria-label="Adicionar novo motorista"
                            >
                                <UserPlusIcon className="h-4 w-4 mr-1" />
                                Novo
                            </button>
                        )}
                      </div>
                      {!isAddingDriver ? (
                          <select
                              id="driverId"
                              name="driverId"
                              value={formData.driverId}
                              onChange={handleChange}
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
                      ) : (
                          <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                  <input
                                      type="text"
                                      value={newDriverName}
                                      onChange={(e) => setNewDriverName(e.target.value)}
                                      placeholder="Nome do novo motorista"
                                      className="flex-grow bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                      autoFocus
                                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDriver(); } }}
                                  />
                                  <button
                                      type="button"
                                      onClick={handleAddDriver}
                                      disabled={isSubmittingDriver}
                                      className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                      {isSubmittingDriver ? '...' : 'Salvar'}
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => {
                                          setIsAddingDriver(false);
                                          setNewDriverName('');
                                          setAddDriverError('');
                                      }}
                                      className="p-2 text-brand-text-secondary hover:bg-gray-700 rounded-full"
                                      aria-label="Cancelar"
                                  >
                                      <XMarkIcon className="h-5 w-5" />
                                  </button>
                              </div>
                              {addDriverError && <p className="text-red-500 text-xs">{addDriverError}</p>}
                          </div>
                      )}
                    </div>

                     <div>
                         <label htmlFor="km" className="block text-sm font-medium text-brand-text-secondary mb-2">
                            Quilometragem {isSaida ? 'de Saída' : 'de Chegada'}
                        </label>
                        <input
                          id="km"
                          name="km"
                          type="number"
                          value={formData.km}
                          onChange={handleChange}
                          placeholder="Ex: 123456"
                          className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                          required
                        />
                      </div>
                    
                    {isSaida && (
                      <div>
                        <label htmlFor="destination" className="block text-sm font-medium text-brand-text-secondary mb-2">Destino</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                          {commonDestinations.map(d => (
                            <button type="button" key={d} onClick={() => setFormData(p => ({...p, destination: d}))} className={`text-sm py-2 px-1 rounded-md transition-colors ${formData.destination === d ? 'bg-brand-accent text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
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
                      </div>
                    )}

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    
                    <div className="!mt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Salvando...' : `Confirmar ${isSaida ? 'Saída' : 'Chegada'}`}
                      </button>
                    </div>

                </form>
            </>
        )}
      </div>
    </div>
  )
}