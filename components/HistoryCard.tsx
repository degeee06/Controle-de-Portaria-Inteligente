import React from 'react';
import type { Vehicle, Driver, Movement } from '../types';
import { ArrowRightOnRectangleIcon } from './icons/ArrowRightOnRectangleIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { TrashIcon } from './icons/TrashIcon';

interface HistoryCardProps {
  movement: Movement;
  vehicle: Vehicle;
  driver: Driver;
  onDelete?: () => void;
}

const formatDateTime = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const EventBadge: React.FC<{ type: 'SAIDA' | 'CHEGADA' }> = ({ type }) => {
    const isSaida = type === 'SAIDA';
    const bgColor = isSaida ? 'bg-red-500/20' : 'bg-green-500/20';
    const textColor = isSaida ? 'text-red-400' : 'text-green-400';
    const text = isSaida ? 'Saída' : 'Chegada';
    const Icon = isSaida ? ArrowRightOnRectangleIcon : ArrowLeftOnRectangleIcon;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            <Icon className="h-3.5 w-3.5 mr-1.5" />
            {text}
        </span>
    );
};


export const HistoryCard: React.FC<HistoryCardProps> = ({ movement, vehicle, driver, onDelete }) => {
  return (
    <div className="bg-brand-secondary rounded-lg p-4 shadow-lg relative">
        {onDelete && (
            <button
                onClick={onDelete}
                className="absolute top-2 right-2 p-1.5 text-brand-text-secondary hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                aria-label="Excluir registro"
            >
                <TrashIcon className="h-4 w-4" />
            </button>
        )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-3">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <p className="font-bold text-lg text-brand-text-primary">{vehicle.plate} - {vehicle.model}</p>
        </div>
        <EventBadge type={movement.type} />
      </div>
      <div className="border-t border-gray-700 pt-3 text-sm space-y-2">
        <p>
            <span className="font-semibold text-brand-text-secondary">Data/Hora: </span>
            <span className="text-brand-text-primary">{formatDateTime(movement.timestamp)}</span>
        </p>
        <p>
            <span className="font-semibold text-brand-text-secondary">Motorista: </span>
            <span className="text-brand-text-primary">{driver.name}</span>
        </p>
         <p>
            <span className="font-semibold text-brand-text-secondary">Quilometragem: </span>
            <span className="text-brand-text-primary">{movement.km.toLocaleString('pt-BR')} km</span>
        </p>
        {movement.type === 'SAIDA' && movement.destination && (
            <p>
                <span className="font-semibold text-brand-text-secondary">Destino: </span>
                <span className="text-brand-text-primary">{movement.destination}</span>
            </p>
        )}
      </div>
    </div>
  );
};
