import { useState, useEffect } from 'react';
import { clientService} from '../services/clientServices';
import { Client, ClientRequest } from '../types/client';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [financialStats, setFinancialStats] = useState({
  //   totalDeudaVentas: 0,
  //   totalVentasPagadas: 0,
  //   totalDeudaPrestamos: 0,
  //   totalPrestamosPagados: 0
  // });

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientsData = await clientService.getClients();
      setClients(clientsData);
      
      // Calcular estadísticas financieras totales
      // await calculateFinancialStats(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  // const calculateFinancialStats = async (clientsData: Client[]) => {
  //   try {
  //     let totalDeudaVentas = 0;
  //     let totalVentasPagadas = 0;
  //     let totalDeudaPrestamos = 0;
  //     let totalPrestamosPagados = 0;

  //     // Calcular estadísticas para todos los clientes
  //     for (const client of clientsData) {
  //       try {
  //         const [deudaVentas, ventasPagadas, deudaPrestamos, prestamosPagados] = await Promise.all([

  //           clientService.calcularDeudaTotalVentas(client.id),
  //           clientService.calcularTotalVentasPagadas(client.id),
  //           clientService.calcularDeudaTotalPrestamos(client.id),
  //           clientService.calcularTotalPrestamosPagados(client.id)
  //         ]);

  //         totalDeudaVentas += deudaVentas;
  //         totalVentasPagadas += ventasPagadas;
  //         totalDeudaPrestamos += deudaPrestamos;
  //         totalPrestamosPagados += prestamosPagados;
  //       } catch (err) {
  //         console.warn(`Error calculando estadísticas para cliente ${client.id}:`, err);
  //       }
  //     }

  //     setFinancialStats({
  //       totalDeudaVentas,
  //       totalVentasPagadas,
  //       totalDeudaPrestamos,
  //       totalPrestamosPagados
  //     });
  //   } catch (err) {
  //     console.error('Error calculando estadísticas financieras:', err);
  //   }
  // };
  const createClient = async (clientData: ClientRequest): Promise<Client> => {
    try {
      const newClient = await clientService.createClient(clientData);
      setClients(prev => [...prev, newClient]);
      // Recalcular estadísticas después de crear un cliente
      // await calculateFinancialStats([...clients, newClient]);
      return newClient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateClient = async (id: number, clientData: ClientRequest): Promise<Client> => {
    try {
      const updatedClient = await clientService.updateClient(id, clientData);
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
      // Recalcular estadísticas después de actualizar un cliente
      // const updatedClients = clients.map(client => 
      //   client.id === id ? updatedClient : client
      // );
      // await calculateFinancialStats(updatedClients);
      return updatedClient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };


  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    // financialStats,
    fetchClients,
    createClient,
    updateClient,
  };
};