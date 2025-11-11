import React, { useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import type { Vehicle } from '../types';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (plate: string, model: string) => Promise<void>;
  vehicles: Vehicle[];
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onAddVehicle, vehicles }) => {
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedVehicle, setAddedVehicle] = useState<{ plate: string, model: string } | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !model) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
        const upperPlate = plate.toUpperCase();
        await onAddVehicle(upperPlate, model);
        setAddedVehicle({ plate: upperPlate, model });
        setIsSuccess(true);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Falha ao adicionar veículo. Tente novamente.');
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Reset state when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
        setPlate('');
        setModel('');
        setError('');
        setIsSubmitting(false);
        setIsSuccess(false);
        setAddedVehicle(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderSuccessView = () => (
    <div className="flex flex-col items-center text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-brand-text-primary">Veículo Adicionado!</h2>
        {addedVehicle && (
             <p className="text-brand-text-secondary mb-6">O veículo <span className="font-semibold text-brand-text-primary">{addedVehicle.plate} - {addedVehicle.model}</span> foi salvo.</p>
        )}
        <button onClick={onClose} className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-lg transition-colors">
            OK
        </button>
    </div>
  );

  const renderFormView = () => (
    <>
        <div className="flex-shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary">
                <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-brand-text-primary">Adicionar Novo Veículo</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="plate" className="block text-sm font-medium text-brand-text-secondary mb-2">Placa</label>
                    <input
                        id="plate" type="text" value={plate} onChange={(e) => setPlate(e.target.value)}
                        placeholder="ABC-1234"
                        className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" required
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="model" className="block text-sm font-medium text-brand-text-secondary mb-2">Modelo</label>
                    <input
                        id="model" type="text" value={model} onChange={(e) => setModel(e.target.value)}
                        placeholder="Ex: Ford Ranger"
                        className="w-full bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" required
                    />
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
                </button>
            </form>
        </div>
        
        <div className="border-t border-gray-700 my-4"></div>

        <div className="flex-grow overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold mb-3 text-brand-text-primary">Veículos Cadastrados</h3>
            {vehicles.length > 0 ? (
                <ul className="space-y-2">
                    {[...vehicles].sort((a, b) => a.plate.localeCompare(b.plate)).map(vehicle => (
                        <li key={vehicle.id} className="bg-brand-primary p-3 rounded-lg flex justify-between items-center text-sm">
                            <span className="font-medium text-brand-text-primary">{vehicle.plate}</span>
                            <span className="text-brand-text-secondary">{vehicle.model}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-brand-text-secondary text-center py-4">Nenhum veículo cadastrado.</p>
            )}
        </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-md p-6 relative flex flex-col max-h-[90vh]">
        {isSuccess ? renderSuccessView() : renderFormView()}
      </div>
    </div>
  );
};