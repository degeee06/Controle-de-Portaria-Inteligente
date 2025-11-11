import React, { useState, useEffect } from 'react';
import type { Vehicle, Driver, ManualLogData } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
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


export const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, vehicles, drivers, onAddCompletedLog }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverIdOut: '',
    timestampOut: toDateTimeLocal(new Date()),
    kmOut: '',
    destination: '',
    driverIdIn: '',
    timestampIn: toDateTimeLocal(new Date()),
    kmIn: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        // Reset form on close
        setFormData({
            vehicleId: '',
            driverIdOut: '',
            timestampOut: toDateTimeLocal(new Date()),
            kmOut: '',
            destination: '',
            driverIdIn: '',
            timestampIn: toDateTimeLocal(new Date()),
            kmIn: ''
        });
        setError('');
        setIsSubmitting(false);
    }
  }, [isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validation ---
    if (!formData.vehicleId || !formData.driverIdOut || !formData.driverIdIn || !formData.destination.trim()) {
        setError('Todos os campos de seleção e destino são obrigatórios.');
        return;
    }

    const kmOut = parseInt(formData.kmOut, 10);
    const kmIn = parseInt(formData.kmIn, 10);
    if (isNaN(kmOut) || isNaN(kmIn) || kmOut < 0 || kmIn < 0) {
        setError('Valores de quilometragem inválidos.');
        return;
    }

    if (kmIn < kmOut) {
        setError('A KM de chegada não pode ser menor que a de saída.');
        return;
    }
    
    const timestampOut = new Date(formData.timestampOut);
    const timestampIn = new Date(formData.timestampIn);
    if (timestampIn <= timestampOut) {
        setError('A data/hora de chegada deve ser posterior à de saída.');
        return;
    }

    const manualLogData: ManualLogData = {
        vehicleId: formData.vehicleId,
        driverIdOut: formData.driverIdOut,
        timestampOut,
        kmOut,
        destination: formData.destination.trim(),
        driverIdIn: formData.driverIdIn,
        timestampIn,
        kmIn,
    };
    
    setIsSubmitting(true);
    try {
      await onAddCompletedLog(manualLogData);
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
          Regularizar Viagem / Lançamento Manual
        </h2>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-2 space-y-4">
            <div>
                <label htmlFor="vehicleId" className="block text-sm font-medium text-brand-text-secondary mb-1">Veículo</label>
                <select id="vehicleId" name="vehicleId" value={formData.vehicleId} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent">
                    <option value="" disabled>Selecione um veículo</option>
                    {vehicles.sort((a,b) => a.plate.localeCompare(b.plate)).map(v => (
                        <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                </select>
            </div>
          
            <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Detalhes da Saída</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="driverIdOut" className="block text-sm font-medium text-brand-text-secondary mb-1">Motorista (Saída)</label>
                        <select id="driverIdOut" name="driverIdOut" value={formData.driverIdOut} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="" disabled>Selecione</option>
                            {drivers.sort((a,b) => a.name.localeCompare(b.name)).map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="kmOut" className="block text-sm font-medium text-brand-text-secondary mb-1">KM Saída</label>
                        <input id="kmOut" name="kmOut" type="number" value={formData.kmOut} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" placeholder="KM de Saída" />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="destination" className="block text-sm font-medium text-brand-text-secondary mb-1">Destino</label>
                        <input id="destination" name="destination" type="text" value={formData.destination} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" placeholder="Destino da viagem" />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="timestampOut" className="block text-sm font-medium text-brand-text-secondary mb-1">Data/Hora Saída</label>
                        <input id="timestampOut" name="timestampOut" type="datetime-local" value={formData.timestampOut} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
                 <h3 className="text-lg font-semibold text-green-400 mb-2">Detalhes da Chegada</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="driverIdIn" className="block text-sm font-medium text-brand-text-secondary mb-1">Motorista (Chegada)</label>
                        <select id="driverIdIn" name="driverIdIn" value={formData.driverIdIn} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="" disabled>Selecione</option>
                            {drivers.sort((a,b) => a.name.localeCompare(b.name)).map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="kmIn" className="block text-sm font-medium text-brand-text-secondary mb-1">KM Chegada</label>
                        <input id="kmIn" name="kmIn" type="number" value={formData.kmIn} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" placeholder="KM de Chegada" />
                    </div>
                     <div className="sm:col-span-2">
                        <label htmlFor="timestampIn" className="block text-sm font-medium text-brand-text-secondary mb-1">Data/Hora Chegada</label>
                        <input id="timestampIn" name="timestampIn" type="datetime-local" value={formData.timestampIn} onChange={handleChange} required className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="pt-4">
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Salvando...' : 'Salvar Registro de Viagem'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};