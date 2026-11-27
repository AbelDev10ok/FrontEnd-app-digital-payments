import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import AutocompleteSeller from '@/shared/components/AutocompleteSeller';
import { clientService } from '@/features/clients/services/clientServices';
import type { Client } from '@/shared/types/client';

interface DeshabilitarVendedorModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  /** Se llama después de la baja; la ficha refleja que ya no es vendedor. */
  onDisabled: () => void;
}

type Modo = 'transferir' | 'sinVendedor';

/**
 * Baja de un vendedor con cartera. Antes el backend la rechazaba y obligaba a
 * editar cliente por cliente; ahora la cartera se resuelve completa en una sola
 * operación: se traspasa a otro vendedor o queda sin vendedor (la cobra el
 * negocio). En los dos casos el vendido y el cobrado ya hechos no se mueven:
 * la autoría está sellada en cada operación.
 */
export default function DeshabilitarVendedorModal({
  isOpen,
  client,
  onClose,
  onDisabled,
}: DeshabilitarVendedorModalProps) {
  const [modo, setModo] = useState<Modo>('transferir');
  const [destinoId, setDestinoId] = useState('');
  const [sellers, setSellers] = useState<Client[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enCartera = client?.clientesEnCartera ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    setModo('transferir');
    setDestinoId('');
    setError(null);
    setIsLoading(false);
    if (enCartera === 0) return;

    let cancelado = false;
    setLoadingSellers(true);
    clientService
      .getVendedoresActivos()
      .then((data) => {
        if (cancelado) return;
        // El propio vendedor no puede recibir su cartera.
        setSellers(data.filter((vendedor) => vendedor.id !== client?.id));
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los vendedores.');
      })
      .finally(() => {
        if (!cancelado) setLoadingSellers(false);
      });

    return () => {
      cancelado = true;
    };
  }, [isOpen, client?.id, enCartera]);

  const puedeConfirmar = enCartera === 0 || modo === 'sinVendedor' || destinoId !== '';

  const handleConfirm = async () => {
    if (!client || isLoading || !puedeConfirmar) return;
    setIsLoading(true);
    setError(null);
    try {
      const destino =
        enCartera === 0
          ? undefined
          : modo === 'transferir'
            ? { transferToSellerId: Number(destinoId) }
            : { leaveClientsUnassigned: true };

      await clientService.desabilitarVendedor(client.id, destino);
      onDisabled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al deshabilitar al vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Deshabilitar a ${client?.name ?? 'este vendedor'}`}>
      <div className="mt-4 space-y-4">
        <p className="text-sm text-gray-600">
          Deja de poder recibir clientes nuevos. Las operaciones que ya hizo siguen siendo suyas:
          el vendido y el cobrado no se mueven.
        </p>

        {enCartera === 0 ? (
          <p className="text-sm text-gray-600">No tiene clientes en cartera.</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-800">
              Tiene {enCartera} {enCartera === 1 ? 'cliente' : 'clientes'} en cartera. ¿Qué hago con{' '}
              {enCartera === 1 ? 'él' : 'ellos'}?
            </p>

            <label className="flex gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer">
              <input
                type="radio"
                name="cartera-vendedor"
                className="mt-1"
                checked={modo === 'transferir'}
                onChange={() => setModo('transferir')}
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">Traspasarlos a otro vendedor</span>
                <span className="block text-xs text-gray-500">
                  La deuda pasa a la cartera del vendedor que elijas.
                </span>
              </span>
            </label>

            {modo === 'transferir' && (
              <div className="pl-7">
                {loadingSellers ? (
                  <p className="text-sm text-gray-500">Cargando vendedores...</p>
                ) : (
                  <AutocompleteSeller
                    value={destinoId}
                    sellers={sellers}
                    onChange={setDestinoId}
                    placeholder="Elegir vendedor"
                  />
                )}
              </div>
            )}

            <label className="flex gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer">
              <input
                type="radio"
                name="cartera-vendedor"
                className="mt-1"
                checked={modo === 'sinVendedor'}
                onChange={() => setModo('sinVendedor')}
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">Dejarlos sin vendedor</span>
                <span className="block text-xs text-gray-500">
                  Los cobra el negocio: la deuda queda en la fila «Sin vendedor».
                </span>
              </span>
            </label>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={!puedeConfirmar}
          >
            Deshabilitar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
