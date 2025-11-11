import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import type { Log, Vehicle, Driver } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
  logs: Log[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

// A simple markdown to HTML converter for basic formatting
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    const formattedContent = content
      .split('\n')
      .map(line => {
        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2 class="text-xl font-semibold mt-4 mb-2">${line.substring(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold mb-3">${line.substring(2)}</h1>`;
        if (line.startsWith('- ')) return `<li class="ml-5 list-disc">${line.substring(2)}</li>`;
        if (line.startsWith('**') && line.endsWith('**')) return `<strong>${line.substring(2, line.length - 2)}</strong>`;
        return line ? `<p class="mb-2">${line}</p>` : '<br />';
      })
      .join('');
  
    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, content, isLoading, logs, vehicles, drivers }) => {
  if (!isOpen) return null;

  const formatDateTime = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  };

  const handleExportCsv = () => {
    const headers = [
        "Placa", "Modelo", "Motorista (Saída)", "Motorista (Chegada)", "Destino", 
        "Data/Hora Saída", "KM Saída", 
        "Data/Hora Chegada", "KM Chegada", 
        "Distância Percorrida (KM)"
    ];

    const rows = logs.map(log => {
        const vehicle = vehicles.find(v => v.id === log.vehicleId);
        const driverOut = drivers.find(d => d.id === log.driverIdOut);
        const driverIn = log.driverIdIn ? drivers.find(d => d.id === log.driverIdIn) : null;
        const distance = (log.kmIn && log.kmOut) ? log.kmIn - log.kmOut : 'N/A';
        const escapeCsv = (str: any) => `"${String(str ?? '').replace(/"/g, '""')}"`;

        return [
            escapeCsv(vehicle?.plate),
            escapeCsv(vehicle?.model),
            escapeCsv(driverOut?.name),
            escapeCsv(driverIn?.name),
            escapeCsv(log.destination),
            escapeCsv(formatDateTime(log.timestampOut)),
            log.kmOut,
            escapeCsv(formatDateTime(log.timestampIn)),
            log.kmIn || 'N/A',
            distance
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + "\n" 
        + rows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_portaria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePrintPdf = () => {
      const reportContentElement = document.getElementById('report-content-for-print');
      if (!reportContentElement) return;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
              <html>
              <head>
                  <title>Relatório Diário de Atividades</title>
                  <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.5; padding: 20px; }
                      h1, h2, h3 { margin-bottom: 0.5em; }
                      ul { padding-left: 20px; }
                      li { margin-bottom: 0.5em; }
                      p { margin-bottom: 1em; }
                      strong { font-weight: bold; }
                  </style>
              </head>
              <body>
                  ${reportContentElement.innerHTML}
              </body>
              </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
      }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary">
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-brand-text-primary">Relatório Diário de Atividades</h2>
        
        <div className="overflow-y-auto pr-2 text-brand-text-secondary flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent"></div>
              <p className="mt-4">Gerando relatório com IA...</p>
            </div>
          ) : (
            <div id="report-content-for-print" className="prose prose-invert">
                 <MarkdownContent content={content} />
            </div>
          )}
        </div>

        {!isLoading && content && !content.startsWith("Nenhuma viagem") && (
          <div className="mt-6 pt-4 border-t border-gray-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handlePrintPdf}
              className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Exportar PDF
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Exportar CSV
            </button>
          </div>
        )}

      </div>
    </div>
  );
};