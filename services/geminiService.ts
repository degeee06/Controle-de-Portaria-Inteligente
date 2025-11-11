import { GoogleGenAI } from "@google/genai";
import type { Vehicle, Driver, Log } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateReport = async (logs: Log[], vehicles: Vehicle[], drivers: Driver[]): Promise<string> => {
    if (!logs.length) {
        return "Nenhuma viagem completada hoje para gerar um relatório.";
    }

    const logDetails = logs.map(log => {
        const vehicle = vehicles.find(v => v.id === log.vehicleId);
        const driver = drivers.find(d => d.id === log.driverIdOut);
        const distance = log.kmIn && log.kmOut ? log.kmIn - log.kmOut : 'N/A';
        return `- Veículo ${vehicle?.model} (${vehicle?.plate}), Motorista: ${driver?.name}, Destino: ${log.destination}, Distância: ${distance} km.`;
    }).join('\n');

    const prompt = `
    Você é um assistente de portaria. Sua tarefa é gerar um resumo conciso e profissional das atividades de veículos do dia com base nos seguintes registros.
    O resumo deve ser em português do Brasil, bem formatado em markdown, e destacar informações importantes como o número total de viagens e talvez a viagem mais longa.

    Dados dos Registros:
    ${logDetails}

    Por favor, gere o relatório do dia.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocorreu um erro ao conectar com a IA para gerar o relatório. Verifique a chave de API e tente novamente.";
  }
};
