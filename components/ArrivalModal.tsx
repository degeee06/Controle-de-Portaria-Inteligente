import React, { useState, useEffect, useMemo } from 'react';
import type { Vehicle, Log, Driver, ManualLogData } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface ArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  outLogsMap: Map<string, Log>;
  onLogEntry: (log: Log, kmIn: number, driverIdIn: string, destination: string) => Promise<void>;
  onAddCompletedLog: (data: ManualLogData) => Promise<void>;
}

const toDateTimeLocal = (date: Date): string => {
    const ten = (i: number) => (i < 10 ? '0' : '') + i;
    const YYYY = date.getFullYear();
    const MM = ten(date.getMonth() + 1);
    const DD = ten(date.getDate());
    const HH = ten(date.getHours());
    const mm = ten(date.getMinutes());
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
};

const formatDateTime = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const initialFormData = {
    kmIn: '',
    driverIdIn: '',
    timestampIn: toDateTimeLocal(new Date()),
    kmOut: '',
    driverIdOut: '',
    destination: '',
    timestampOut: toDateTimeLocal(new Date()),
};

export const ArrivalModal: React.FC<ArrivalModalProps> = ({ isOpen, onClose, vehicles, drivers, outLogsMap, onLogEntry, onAddCompletedLog }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [mode, setMode] = useState<'update' | 'create' | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { vehiclesOut, vehiclesIn } = useMemo(() => {
    const out = vehicles.filter(v => outLogsMap.has(v.id)).sort((a,b) => a.plate.localeCompare(b.plate));
    const inGarage = vehicles.filter(v => !outLogsMap.has(v.id)).sort((a,b) => a.plate.localeCompare(b.plate));
    return { vehiclesOut: out, vehiclesIn: inGarage };
  }, [vehicles, outLogsMap]);

  const selectedLog = useMemo(() => {
    if (mode !== 'update' || !selectedVehicleId) return null;
    return outLogsMap.get(selectedVehicleId) || null;
  }, [selectedVehicleId, outLogsMap, mode]);
  
  const outboundDriver = useMemo(() => {
      if (!selectedLog) return null;
      return drivers.find(d => d.id === selectedLog.driverIdOut);
  }, [selectedLog, drivers]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicleId('');
      setFormData(initialFormData);
      setError('');
      setIsSubmitting(false);
      setMode(null);
    }
  }, [isOpen]);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    setSelectedVehicleId(vehicleId);
    setError('');
    setFormData(initialFormData);

    if (vehicleId) {
        if (outLogsMap.has(vehicleId)) {
            setMode('update');
        } else {
            setMode('create');
        }
    } else {
        setMode(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedVehicleId) {
        setError('Por favor, selecione um veículo.');
        return;
    }

    const kmIn = parseInt(formData.kmIn, 10);
    if (isNaN(kmIn) || kmIn < 0) {
      setError('Quilometragem de chegada inválida.');
      return;
    }

    if (!formData.driverIdIn) {
        setError('Por favor, selecione o motorista que está retornando.');
        return;
    }

    setIsSubmitting(true);
    try {
        if (mode === 'update' && selectedLog) {
            await onLogEntry(selectedLog, kmIn, formData.driverIdIn, 'Sistema Interno');
        } else if (mode === 'create') {
            // --- Validation for create mode ---
            if (!formData.driverIdOut || !formData.destination.trim()) {
                setError('Todos os campos de saída são obrigatórios.');
                setIsSubmitting(false);
                return;
            }
            const kmOut = parseInt(formData.kmOut, 10);
            if (isNaN(kmOut) || kmOut < 0) {
                setError('Quilometragem de saída inválida.');
                setIsSubmitting(false);
                return;
            }
            if (kmIn < kmOut) {
                setError('A KM de chegada não pode ser menor que a de saída.');
                setIsSubmitting(false);
                return;
            }
            const timestampOut = new Date(formData.timestampOut);
            const timestampIn = new Date(formData.timestampIn);
            if (timestampIn <= timestampOut) {
                setError('A data/hora de chegada deve ser posterior à de saída.');
                setIsSubmitting(false);
                return;
            }

            const manualLogData: ManualLogData = {
                vehicleId: selectedVehicleId,
                driverIdOut: formData.driverIdOut,
                timestampOut,
                kmOut,
                destination: formData.destination.trim(),
                driverIdIn: formData.driverIdIn,
                timestampIn,
                kmIn,
            };
            await onAddCompletedLog(manualLogData);
        }
        onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary">
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-brand-text-primary">
          Registrar Chegada
        </h2>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-2 space-y-4">
          <div>
            <label htmlFor="vehicle-select" className="block text-sm font-medium text-brand-text-secondary mb-1">Veículo</label>
            <select
                id="vehicle-select"
                value={selectedVehicleId}
                onChange={handleVehicleChange}
                className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                required
            >
                <option value="" disabled>Selecione o veículo que retornou</option>
                {vehiclesOut.length > 0 && <optgroup label="Na Rua">
                    {vehiclesOut.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate} - {vehicle.model}
                        </option>
                    ))}
                </optgroup>}
                {vehiclesIn.length > 0 && <optgroup label="Na Garagem">
                     {vehiclesIn.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate} - {vehicle.model}
                        </option>
                    ))}
                </optgroup>}
            </select>
          </div>

          {mode === 'update' && selectedLog && (
            <>
                <div className="bg-brand-primary p-3 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-brand-text-primary mb-2">Detalhes da Saída</h3>
                     <p className="text-sm text-brand-text-secondary"><strong>Motorista (Saída):</strong> {outboundDriver?.name || 'N/A'}</p>
                    <p className="text-sm text-brand-text-secondary"><strong>Destino:</strong> {selectedLog.destination}</p>
                    <p className="text-sm text-brand-text-secondary"><strong>Saída:</strong> {formatDateTime(selectedLog.timestampOut)} ({selectedLog.kmOut.toLocaleString('pt-BR')} km)</p>
                </div>
            </>
          )}

          {mode === 'create' && (
             <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Registrar Saída (Pendente)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="driverIdOut" className="block text-sm font-medium text-brand-text-secondary mb-1">Motorista (Saída)</label>
                        <select id="driverIdOut" name="driverIdOut" value={formData.driverIdOut} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="" disabled>Selecione</option>
                            {drivers.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="kmOut" className="block text-sm font-medium text-brand-text-secondary mb-1">KM Saída</label>
                        <input id="kmOut" name="kmOut" type="number" value={formData.kmOut} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="destination" className="block text-sm font-medium text-brand-text-secondary mb-1">Destino</label>
                        <input id="destination" name="destination" type="text" value={formData.destination} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="timestampOut" className="block text-sm font-medium text-brand-text-secondary mb-1">Data/Hora Saída</label>
                        <input id="timestampOut" name="timestampOut" type="datetime-local" value={formData.timestampOut} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                </div>
            </div>
          )}

          {mode && (
              <div className="border-t border-gray-700 pt-4">
                 <h3 className="text-lg font-semibold text-green-400 mb-2">Detalhes da Chegada</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="driverIdIn" className="block text-sm font-medium text-brand-text-secondary mb-1">Motorista (Chegada)</label>
                        <select id="driverIdIn" name="driverIdIn" value={formData.driverIdIn} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="" disabled>Selecione</option>
                            {drivers.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="kmIn" className="block text-sm font-medium text-brand-text-secondary mb-1">KM Chegada</label>
                        <input id="kmIn" name="kmIn" type="number" value={formData.kmIn} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                     {mode === 'create' && <div className="sm:col-span-2">
                        <label htmlFor="timestampIn" className="block text-sm font-medium text-brand-text-secondary mb-1">Data/Hora Chegada</label>
                        <input id="timestampIn" name="timestampIn" type="datetime-local" value={formData.timestampIn} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>}
                </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !mode}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Chegada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};