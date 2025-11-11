import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import type { Driver } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  onAddDriver: (driverName: string) => Promise<Driver>;
}

export const DriverModal: React.FC<DriverModalProps> = ({ isOpen, onClose, drivers, onAddDriver }) => {
  const [driverName, setDriverName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
        setDriverName('');
        setError('');
        setIsSubmitting(false);
        setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) {
      setError('O nome do motorista é obrigatório.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
        await onAddDriver(driverName);
        setSuccessMessage(`Motorista "${driverName.trim()}" adicionado!`);
        setDriverName(''); // Clear input on success
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Falha ao adicionar motorista. Tente novamente.');
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-md p-6 relative flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary">
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-brand-text-primary">Gerenciar Motoristas</h2>
        
        <form onSubmit={handleSubmit} className="mb-4">
          <label htmlFor="driverName" className="block text-sm font-medium text-brand-text-secondary mb-2">Novo Motorista</label>
          <div className="flex items-center gap-2">
            <input
              id="driverName" type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)}
              placeholder="Ex: João Silva"
              className="flex-grow bg-brand-primary border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent" required
            />
            <button type="submit" disabled={isSubmitting} className="flex-shrink-0 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold p-2.5 rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? '...' : <UserPlusIcon className="h-5 w-5" />}
            </button>
          </div>
           {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        <div className="border-t border-gray-700 my-4"></div>

        <h3 className="text-lg font-semibold mb-3 text-brand-text-primary">Motoristas Cadastrados</h3>
        
        {successMessage && (
            <div className="bg-green-500/20 text-green-300 text-sm font-medium p-3 rounded-lg mb-3 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>{successMessage}</span>
            </div>
        )}

        <div className="overflow-y-auto pr-2 flex-grow">
            <ul className="space-y-2">
                {drivers.length > 0 ? (
                    drivers.sort((a,b) => a.name.localeCompare(b.name)).map(driver => (
                        <li key={driver.id} className="bg-brand-primary p-3 rounded-lg text-brand-text-primary">
                            {driver.name}
                        </li>
                    ))
                ) : (
                    <p className="text-brand-text-secondary text-center py-4">Nenhum motorista cadastrado.</p>
                )}
            </ul>
        </div>

      </div>
    </div>
  );
};
