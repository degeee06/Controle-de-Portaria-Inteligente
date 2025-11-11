import React, { useMemo, useState, useEffect } from 'react';
import type { Movement, Vehicle, Driver } from '../types';
import { HistoryCard } from './HistoryCard';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

interface HistoryViewProps {
  movements: Movement[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onDeleteMovement: (movement: Movement) => void;
}

const ITEMS_PER_PAGE = 10;

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const HistoryView: React.FC<HistoryViewProps> = ({ movements, vehicles, drivers, onDeleteMovement }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [selectedDate, searchQuery]);

  const sortedMovements = useMemo(() => {
    return [...movements].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    return sortedMovements.filter(movement => {
        if (selectedDate) {
            const logDate = new Date(movement.timestamp);
            const logDateStr = `${logDate.getFullYear()}-${(logDate.getMonth() + 1).toString().padStart(2, '0')}-${logDate.getDate().toString().padStart(2, '0')}`;
            if (logDateStr !== selectedDate) return false;
        }

        if (searchQuery) {
            const driver = drivers.find(d => d.id === movement.driverId);
            const vehicle = vehicles.find(v => v.id === movement.vehicleId);
            
            const searchMatch = 
              (vehicle?.plate.toLowerCase().includes(lowerCaseQuery)) ||
              (vehicle?.model.toLowerCase().includes(lowerCaseQuery)) ||
              (driver?.name.toLowerCase().includes(lowerCaseQuery)) ||
              (movement.destination?.toLowerCase().includes(lowerCaseQuery));

            if (!searchMatch) return false;
        }
        return true;
    });
  }, [sortedMovements, selectedDate, searchQuery, drivers, vehicles]);

  const visibleMovements = useMemo(() => {
    return filteredMovements.slice(0, visibleCount);
  }, [filteredMovements, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
  };
  
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-brand-secondary rounded-lg">
        <h3 className="text-xl font-semibold text-brand-text-primary">Nenhum Registro de Movimento</h3>
        <p className="text-brand-text-secondary mt-2">O histórico de saídas e chegadas aparecerá aqui.</p>
      </div>
    );
  }
  
  const todayDateString = getTodayDateString();
  
  const handleTodayClick = () => {
    if (selectedDate === todayDateString) {
      setSelectedDate(''); // Toggle off
    } else {
      setSelectedDate(todayDateString); // Set to today
    }
  };
  
  const isTodaySelected = selectedDate === todayDateString;

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-brand-text-primary self-start md:self-center">Histórico de Movimentos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-40">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                    </span>
                    <input
                        type="text"
                        placeholder="Filtrar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-brand-secondary border border-gray-700 text-brand-text-secondary text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent block w-full pl-9 p-2"
                        aria-label="Filtrar por nome, placa ou destino"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleTodayClick}
                    className={`w-full text-sm rounded-lg p-2 transition-colors border ${isTodaySelected ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-secondary border-gray-700 text-brand-text-secondary hover:bg-gray-700'}`}
                >
                    Hoje
                </button>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                        setSelectedDate(e.target.value);
                    }}
                    className="bg-brand-secondary border border-gray-700 text-brand-text-secondary text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent block w-full p-2"
                    aria-label="Filtrar por data"
                />
            </div>
        </div>
        
        {filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-brand-secondary rounded-lg">
            <h3 className="text-lg font-semibold text-brand-text-primary">Nenhum Registro Encontrado</h3>
            <p className="text-brand-text-secondary mt-2">Não há movimentos para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="max-h-[calc(75vh-60px)] overflow-y-auto pr-2">
            <div className="space-y-4">
              {visibleMovements.map(movement => {
                const driver = drivers.find(d => d.id === movement.driverId);
                const vehicle = vehicles.find(v => v.id === movement.vehicleId);
                
                if (!driver || !vehicle) return null;

                return (
                  <HistoryCard
                    key={movement.id}
                    movement={movement}
                    driver={driver}
                    vehicle={vehicle}
                    onDelete={() => onDeleteMovement(movement)}
                  />
                );
              })}
            </div>
            {visibleCount < filteredMovements.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  className="bg-brand-secondary hover:bg-gray-700 text-brand-text-secondary font-bold py-2 px-6 rounded-lg transition-colors text-sm border border-gray-700"
                >
                  Carregar Mais
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
