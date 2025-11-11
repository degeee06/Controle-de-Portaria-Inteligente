import React, { useState, useMemo, useRef } from 'react';
import { useVehicleLog } from './hooks/useVehicleLog';
import { RegistrationModal } from './components/RegistrationModal';
import { MovementModal } from './components/MovementModal';
import { HistoryView } from './components/HistoryView';
import { ConfirmationModal } from './components/ConfirmationModal';
import type { Vehicle, Movement, Driver } from './types';
import { PlusIcon } from './components/icons/PlusIcon';
import { ArrowDownTrayIcon } from './components/icons/ArrowDownTrayIcon';
import { ArrowUpTrayIcon } from './components/icons/ArrowUpTrayIcon';
import * as storage from './services/offlineStorageService';
import { DriverModal } from './components/DriverModal';
import { UsersIcon } from './components/icons/UsersIcon';
import { ArrowLeftOnRectangleIcon } from './components/icons/ArrowLeftOnRectangleIcon';
import { ArrowRightOnRectangleIcon } from './components/icons/ArrowRightOnRectangleIcon';


type MovementMode = 'SAIDA' | 'CHEGADA';

function App() {
  const { vehicles, drivers, movements, loading, error, addVehicle, addDriver, registerSaida, registerChegada, deleteVehicle, deleteMovement, importBackup, fetchData } = useVehicleLog();

  const [isRegistrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [isMovementModalOpen, setMovementModalOpen] = useState(false);
  const [movementMode, setMovementMode] = useState<MovementMode>('SAIDA');
  const [isDriverModalOpen, setDriverModalOpen] = useState(false);
  
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  
  const [isDeleteMovementConfirmOpen, setDeleteMovementConfirmOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(null);
  
  const [isImportConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importData, setImportData] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastDepartureMovementsMap = useMemo(() => {
    const map = new Map<string, Movement>();
    const sortedMovementsAsc = [...movements].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sortedMovementsAsc.forEach(m => {
        if(m.type === 'SAIDA') {
            map.set(m.vehicleId, m);
        }
    });
    return map;
  }, [movements]);
  
  const handleOpenMovementModal = (mode: MovementMode) => {
    setMovementMode(mode);
    setMovementModalOpen(true);
  };
  
  const handleCloseModals = () => {
    setRegistrationModalOpen(false);
    setMovementModalOpen(false);
    setDriverModalOpen(false);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setImportData(text);
        setImportConfirmOpen(true);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handleConfirmImport = async () => {
    if (!importData) return;
    
    setIsImporting(true);
    setImportConfirmOpen(false);
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        importBackup(importData);
        fetchData();
    } catch (error) {
        alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao importar.');
    } finally {
        setImportData(null);
        setIsImporting(false);
    }
  };

  const handleDeleteMovementRequest = (movement: Movement) => {
    setMovementToDelete(movement);
    setDeleteMovementConfirmOpen(true);
  };

  const handleConfirmDeleteMovement = () => {
    if (movementToDelete) {
      deleteMovement(movementToDelete.id);
    }
    setDeleteMovementConfirmOpen(false);
    setMovementToDelete(null);
  };
  
  if (isImporting) {
    return (
        <div className="bg-brand-primary min-h-screen flex flex-col items-center justify-center text-brand-text-primary">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent mx-auto"></div>
            <p className="mt-6 text-xl">Importando dados...</p>
        </div>
    );
  }

  return (
    <div className="bg-brand-primary min-h-screen text-brand-text-primary">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
                <h1 className="text-4xl font-bold text-brand-text-primary">Controle de Portaria</h1>
                <p className="text-brand-text-secondary mt-1">Gestão de entradas e saídas de veículos</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 mt-4 sm:mt-0">
                <button 
                  onClick={() => handleOpenMovementModal('SAIDA')}
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2"/>
                    Registrar Saída
                </button>
                <button 
                  onClick={() => handleOpenMovementModal('CHEGADA')}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2"/>
                    Registrar Chegada
                </button>
                 <button onClick={() => setDriverModalOpen(true)} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <UsersIcon className="h-5 w-5 mr-2"/>
                    Motoristas
                </button>
                <button onClick={() => setRegistrationModalOpen(true)} className="flex items-center bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    Novo Veículo
                </button>
            </div>
        </header>

        {error && <div className="bg-red-500 text-white p-4 rounded-lg mb-6">{error}</div>}

        <div className="bg-brand-secondary p-4 rounded-lg mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                 <h2 className="text-xl font-semibold text-brand-text-primary">Histórico de Movimentos</h2>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                     <button onClick={storage.exportAllData} className="flex items-center bg-brand-secondary hover:bg-gray-700 text-brand-text-secondary font-bold py-2 px-3 rounded-lg transition-colors text-sm border border-gray-700">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2"/>
                        Backup
                    </button>
                    <button onClick={handleImportClick} className="flex items-center bg-brand-secondary hover:bg-gray-700 text-brand-text-secondary font-bold py-2 px-3 rounded-lg transition-colors text-sm border border-gray-700">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2"/>
                        Importar
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
                </div>
            </div>
        </div>
        
        {loading ? (
            <div className="text-center p-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto"></div>
                <p className="mt-4">Carregando dados...</p>
            </div>
        ) : (
           <HistoryView 
                movements={movements} 
                vehicles={vehicles} 
                drivers={drivers} 
                onDeleteMovement={handleDeleteMovementRequest}
            />
        )}
      </div>

      {isRegistrationModalOpen && (
        <RegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={handleCloseModals}
          onAddVehicle={addVehicle}
          vehicles={vehicles}
        />
      )}

      {isDriverModalOpen && (
        <DriverModal
            isOpen={isDriverModalOpen}
            onClose={handleCloseModals}
            drivers={drivers}
            onAddDriver={addDriver}
        />
      )}
      
      {isMovementModalOpen && (
        <MovementModal
            isOpen={isMovementModalOpen}
            onClose={handleCloseModals}
            mode={movementMode}
            vehicles={vehicles}
            drivers={drivers}
            movements={movements}
            lastDepartureMovementsMap={lastDepartureMovementsMap}
            onRegisterSaida={registerSaida}
            onRegisterChegada={registerChegada}
            onAddDriver={addDriver}
        />
      )}

      {isDeleteConfirmOpen && vehicleToDelete && (
        <ConfirmationModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => { /* Logic to delete would go here */ }}
          title="Confirmar Exclusão"
          message={`Deseja realmente excluir o veículo ${vehicleToDelete.plate}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          confirmButtonVariant="danger"
        />
      )}
      
      {isImportConfirmOpen && (
        <ConfirmationModal
          isOpen={isImportConfirmOpen}
          onClose={() => setImportConfirmOpen(false)}
          onConfirm={handleConfirmImport}
          title="Confirmar Importação"
          message="Tem certeza que deseja importar este arquivo? Todos os dados atuais no aplicativo serão substituídos por este backup."
          confirmText="Importar"
          confirmButtonVariant="primary"
        />
      )}

      {isDeleteMovementConfirmOpen && movementToDelete && (
        <ConfirmationModal
          isOpen={isDeleteMovementConfirmOpen}
          onClose={() => setDeleteMovementConfirmOpen(false)}
          onConfirm={handleConfirmDeleteMovement}
          title="Confirmar Exclusão"
          message={`Deseja realmente excluir este registro de movimento? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
}

export default App;
