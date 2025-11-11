import React from 'react';
import type { Vehicle, Driver, Movement } from '../types';
import { CarIcon } from './icons/CarIcon';
import { TrashIcon } from './icons/TrashIcon';

interface VehicleCardProps {
  vehicle: Vehicle;
  driver?: Driver;
  movement?: Movement;
  onDelete?: () => void;
}

const formatDateTime = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};


export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, driver, movement, onDelete }) => {
  const isEmUso = vehicle.status === 'EM_USO';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="bg-brand-secondary rounded-lg p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between transition-transform transform hover:scale-[1.02] duration-200">
      <div className="flex items-center mb-4 sm:mb-0 flex-grow w-full">
        <div className="bg-brand-accent p-3 rounded-full mr-4">
            <CarIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-grow">
          <p className="font-bold text-lg text-brand-text-primary">{vehicle.plate}</p>
          <p className="text-sm text-brand-text-secondary">
            {vehicle.model}
            {isEmUso && driver && <span className="font-semibold text-brand-accent"> - {driver.name}</span>}
          </p>
          {isEmUso && movement && (
            <div className="mt-2 text-sm space-y-1">
                <p className="text-brand-text-primary">
                    <span className="font-semibold text-brand-text-secondary">Destino:</span> {movement.destination}
                </p>
                <p className="text-brand-text-secondary">
                    <span className="font-semibold">Saída:</span> {formatDateTime(movement.timestamp)}
                </p>
                <p className="text-brand-text-secondary">
                    <span className="font-semibold">KM Saída:</span> {movement.km.toLocaleString('pt-BR')} km
                </p>
            </div>
          )}
        </div>
         {!isEmUso && onDelete && (
          <button 
            onClick={handleDelete}
            className="flex-shrink-0 p-2 text-brand-text-secondary hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-red-500/10 ml-auto"
            aria-label="Excluir veículo"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};
