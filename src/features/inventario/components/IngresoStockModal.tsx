import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import { Alert, Button, Field, Input, Select } from '@/shared/components/ui';
import { salesService } from '@/features/ventas/services/salesServices';
import type { ProductDto } from '@/shared/types/sales';
import { resumenEspecificaciones } from '@/shared/utils/productSpecs';

interface LineaState {
  key: number;
  variantId: string;
  quantity: string;
  unitCost: string;
}

interface IngresoStockModalProps {
  isOpen: boolean;
  /** Filas del catálogo (una por SKU) para elegir qué entra. */
  variants: ProductDto[];
  onClose: () => void;
  /** Se llama con el mensaje de éxito para refrescar la vista. */
  onSaved: (mensaje: string) => void;
}

let siguienteKey = 1;

const lineaVacia = (): LineaState => ({
  key: siguienteKey++,
  variantId: '',
  quantity: '',
  unitCost: '',
});

/** Etiqueta de la opción: producto · variante · SKU. */
const etiquetaVariante = (producto: ProductDto) => {
  const detalle = resumenEspecificaciones([producto]);
  return [producto.name, detalle, producto.sku].filter(Boolean).join(' · ');
};

/**
 * Ingreso de mercadería: una operación con varias líneas. Cada línea deja su
 * movimiento INGRESO con el costo unitario observado, sin tocar el costo del
 * catálogo.
 */
export default function IngresoStockModal({
  isOpen,
  variants,
  onClose,
  onSaved,
}: IngresoStockModalProps) {
  const [lineas, setLineas] = useState<LineaState[]>(() => [lineaVacia()]);
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Cada apertura arranca limpia: el modal queda montado aunque esté cerrado.
  useEffect(() => {
    if (!isOpen) return;
    setLineas([lineaVacia()]);
    setNota('');
    setError(null);
  }, [isOpen]);

  const actualizarLinea = (key: number, cambios: Partial<LineaState>) =>
    setLineas((previas) => previas.map((linea) => (linea.key === key ? { ...linea, ...cambios } : linea)));

  const agregarLinea = () => setLineas((previas) => [...previas, lineaVacia()]);

  const quitarLinea = (key: number) =>
    setLineas((previas) => (previas.length === 1 ? previas : previas.filter((linea) => linea.key !== key)));

  const registrarIngreso = async () => {
    if (lineas.length === 0) {
      setError('Agregá al menos una línea de ingreso');
      return;
    }

    const lines = [];
    for (const [indice, linea] of lineas.entries()) {
      const numeroLinea = indice + 1;
      if (linea.variantId === '') {
        setError(`Elegí la variante de la línea ${numeroLinea}`);
        return;
      }
      const cantidad = Number(linea.quantity);
      if (linea.quantity === '' || !Number.isInteger(cantidad) || cantidad <= 0) {
        setError(`La cantidad de la línea ${numeroLinea} debe ser un entero mayor a 0`);
        return;
      }
      let costo: number | null = null;
      if (linea.unitCost !== '') {
        const numero = Number(linea.unitCost);
        if (!Number.isFinite(numero) || numero < 0) {
          setError(`El costo unitario de la línea ${numeroLinea} no puede ser negativo`);
          return;
        }
        costo = numero;
      }
      lines.push({ variantId: Number(linea.variantId), quantity: cantidad, unitCost: costo });
    }

    setGuardando(true);
    setError(null);
    try {
      const movimientos = await salesService.registrarIngresoStock({
        note: nota.trim() || null,
        lines,
      });
      onSaved(
        movimientos.length === 1
          ? 'Ingreso registrado'
          : `Ingreso registrado: ${movimientos.length} movimientos`,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el ingreso de stock');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ingreso de mercadería" size="xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void registrarIngreso();
        }}
        noValidate
      >
        <p className="text-sm text-gray-600">
          Cargá lo que entra al depósito. El costo unitario es opcional y queda registrado en el
          movimiento: no cambia el costo del catálogo.
        </p>

        <div className="mt-4">
          <Field label="Nota (opcional)" htmlFor="ingreso-nota" hint="Ej.: compra a proveedor, reposición.">
            <Input
              id="ingreso-nota"
              value={nota}
              onChange={(event) => setNota(event.target.value)}
              placeholder="Compra a proveedor"
            />
          </Field>
        </div>

        <div className="mt-4 space-y-3">
          {lineas.map((linea, indice) => (
            <div key={linea.key} className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Línea {indice + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Quitar línea ${indice + 1}`}
                  onClick={() => quitarLinea(linea.key)}
                  disabled={lineas.length === 1}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_9rem]">
                <Field label="Variante" htmlFor={`ingreso-variante-${linea.key}`} required>
                  <Select
                    id={`ingreso-variante-${linea.key}`}
                    value={linea.variantId}
                    onChange={(event) => actualizarLinea(linea.key, { variantId: event.target.value })}
                  >
                    <option value="">Elegir SKU</option>
                    {variants.map((producto) => (
                      <option key={producto.variantId} value={producto.variantId ?? ''}>
                        {etiquetaVariante(producto)}
                        {` (stock ${producto.stock ?? 0})`}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Cantidad" htmlFor={`ingreso-cantidad-${linea.key}`} required>
                  <Input
                    id={`ingreso-cantidad-${linea.key}`}
                    type="number"
                    min={1}
                    value={linea.quantity}
                    onChange={(event) => actualizarLinea(linea.key, { quantity: event.target.value })}
                    placeholder="0"
                  />
                </Field>
                <Field label="Costo unitario" htmlFor={`ingreso-costo-${linea.key}`} hint="Opcional">
                  <Input
                    id={`ingreso-costo-${linea.key}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={linea.unitCost}
                    onChange={(event) => actualizarLinea(linea.key, { unitCost: event.target.value })}
                    placeholder="0"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={agregarLinea}
        >
          Agregar línea
        </Button>

        {error && (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={guardando}>
            Registrar ingreso
          </Button>
        </div>
      </form>
    </Modal>
  );
}
