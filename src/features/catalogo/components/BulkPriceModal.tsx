import { useMemo, useState } from 'react';
import { Search, Tags } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import { Alert, Button, Field, Input, Select } from '@/shared/components/ui';
import { salesService } from '@/features/ventas/services/salesServices';
import type {
  BulkPriceMode,
  BulkPriceRequest,
  BulkPriceResult,
  BulkPriceScope,
  ProductDto,
  ProductTypeDto,
} from '@/shared/types/sales';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { aplanarCategorias } from '@/shared/utils/categoryTree';

interface BulkPriceModalProps {
  isOpen: boolean;
  /** Una fila por SKU: es lo que se ajusta. */
  products: ProductDto[];
  categories: ProductTypeDto[];
  onClose: () => void;
  /** Aviso de éxito para la tarjeta del catálogo. */
  onApplied: (mensaje: string) => void;
}

const REDONDEOS = [
  { value: '', label: 'Sin redondeo' },
  { value: '10', label: 'A $10' },
  { value: '100', label: 'A $100' },
  { value: '1000', label: 'A $1.000' },
];

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

/**
 * Ajuste masivo de precios: primero muestra qué quedaría en cada SKU y recién
 * después aplica. El servidor recalcula el preview y la aplicación con el mismo
 * criterio, así que el número que se ve es el que se guarda.
 */
const BulkPriceModal: React.FC<BulkPriceModalProps> = ({
  isOpen,
  products,
  categories,
  onClose,
  onApplied,
}) => {
  const [scope, setScope] = useState<BulkPriceScope>('ALL');
  const [categoryId, setCategoryId] = useState('');
  const [busquedaSku, setBusquedaSku] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<BulkPriceMode>('PERCENT');
  const [value, setValue] = useState('');
  const [adjustCost, setAdjustCost] = useState(true);
  const [roundTo, setRoundTo] = useState('');
  const [preview, setPreview] = useState<BulkPriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  const opcionesCategoria = useMemo(() => aplanarCategorias(categories), [categories]);

  const skusFiltrados = useMemo(() => {
    const consulta = normalizar(busquedaSku.trim());
    if (!consulta) return products;
    return products.filter((producto) =>
      normalizar(`${producto.name} ${producto.sku ?? ''} ${producto.variantLabel ?? ''}`).includes(consulta),
    );
  }, [products, busquedaSku]);

  // Un preview viejo nunca debe aplicarse: cualquier cambio de criterio lo anula.
  const invalidarPreview = () => {
    setPreview(null);
    setError(null);
  };

  const reiniciar = () => {
    setScope('ALL');
    setCategoryId('');
    setBusquedaSku('');
    setSeleccionados(new Set());
    setMode('PERCENT');
    setValue('');
    setAdjustCost(true);
    setRoundTo('');
    setPreview(null);
    setError(null);
    setCalculando(false);
    setAplicando(false);
  };

  const cerrar = () => {
    reiniciar();
    onClose();
  };

  const alternarSku = (variantId: number) => {
    invalidarPreview();
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(variantId)) {
        siguiente.delete(variantId);
      } else {
        siguiente.add(variantId);
      }
      return siguiente;
    });
  };

  /** Devuelve el payload o el mensaje que falta para poder pedir el preview. */
  const construirPayload = (): { payload: BulkPriceRequest } | { faltante: string } => {
    const valor = Number(value);
    if (value.trim() === '' || Number.isNaN(valor) || valor === 0) {
      return { faltante: 'Ingresá un valor distinto de cero' };
    }
    if (mode === 'PERCENT' && valor <= -100) {
      return { faltante: 'El porcentaje debe ser mayor a -100%' };
    }
    if (scope === 'CATEGORY' && !categoryId) {
      return { faltante: 'Elegí la categoría a ajustar' };
    }
    if (scope === 'VARIANTS' && seleccionados.size === 0) {
      return { faltante: 'Elegí al menos un SKU' };
    }
    return {
      payload: {
        scope,
        categoryId: scope === 'CATEGORY' ? Number(categoryId) : null,
        variantIds: scope === 'VARIANTS' ? Array.from(seleccionados) : [],
        mode,
        value: valor,
        adjustCost,
        roundTo: roundTo === '' ? null : Number(roundTo),
      },
    };
  };

  const verCambios = async () => {
    const armado = construirPayload();
    if ('faltante' in armado) {
      setError(armado.faltante);
      return;
    }
    setCalculando(true);
    setError(null);
    setPreview(null);
    try {
      setPreview(await salesService.previewBulkPrice(armado.payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular el ajuste');
    } finally {
      setCalculando(false);
    }
  };

  const aplicar = async () => {
    if (!preview) return;
    const armado = construirPayload();
    if ('faltante' in armado) {
      setError(armado.faltante);
      return;
    }
    setAplicando(true);
    setError(null);
    try {
      const resultado = await salesService.applyBulkPrice(armado.payload);
      onApplied(
        resultado.changedCount === 1
          ? 'Precio actualizado en 1 SKU'
          : `Precios actualizados en ${resultado.changedCount} SKUs`,
      );
      cerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar el ajuste');
    } finally {
      setAplicando(false);
    }
  };

  const filasCambiadas = preview?.rows.filter((fila) => fila.changed) ?? [];
  // Una sola acción principal: primero calcula, después aplica. Nunca queda un
  // botón "Aplicar" apagado sin explicación (era el bloqueo reportado).
  const listoParaAplicar = preview != null && preview.changedCount > 0;

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Ajuste masivo de precios" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Actualiza el precio de venta de varios SKUs a la vez. El contado usa ese mismo precio: no hay un
          precio de contado aparte.
        </p>

        <Field label="Alcance" htmlFor="ajuste-alcance">
          <Select
            id="ajuste-alcance"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as BulkPriceScope);
              invalidarPreview();
            }}
          >
            <option value="ALL">Todo el catálogo</option>
            <option value="CATEGORY">Una categoría</option>
            <option value="VARIANTS">SKUs elegidos</option>
          </Select>
        </Field>

        {scope === 'CATEGORY' && (
          <Field label="Categoría" htmlFor="ajuste-categoria" hint="Incluye las subcategorías.">
            <Select
              id="ajuste-categoria"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                invalidarPreview();
              }}
            >
              <option value="">Elegí una categoría</option>
              {opcionesCategoria.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'— '.repeat(cat.depth)}
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {scope === 'VARIANTS' && (
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                aria-label="Buscar SKUs"
                value={busquedaSku}
                onChange={(e) => setBusquedaSku(e.target.value)}
                placeholder="Buscar por producto, SKU o variante…"
                className="pl-9"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 p-2">
              {skusFiltrados.length === 0 ? (
                <p className="px-2 py-3 text-sm text-gray-500">No hay SKUs que coincidan.</p>
              ) : (
                skusFiltrados.map((producto) => {
                  const id = producto.variantId ?? producto.id;
                  const etiqueta = producto.variantLabel ? ` · ${producto.variantLabel}` : '';
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={seleccionados.has(id)}
                        onChange={() => alternarSku(id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      />
                      <span className="min-w-0 truncate">
                        {producto.name}
                        {etiqueta} · {producto.sku ?? 'Sin SKU'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{seleccionados.size} SKUs seleccionados.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ajuste" htmlFor="ajuste-modo">
            <Select
              id="ajuste-modo"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as BulkPriceMode);
                invalidarPreview();
              }}
            >
              <option value="PERCENT">Porcentaje (%)</option>
              <option value="AMOUNT">Monto fijo por unidad</option>
            </Select>
          </Field>
          <Field
            label={mode === 'PERCENT' ? 'Porcentaje' : 'Monto'}
            htmlFor="ajuste-valor"
            hint={mode === 'PERCENT' ? 'Usá negativo para bajar.' : 'Se suma al precio actual.'}
          >
            <Input
              id="ajuste-valor"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                invalidarPreview();
              }}
              placeholder={mode === 'PERCENT' ? '10' : '500'}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Redondeo del precio" htmlFor="ajuste-redondeo" hint="Redondea al múltiplo más cercano.">
            <Select
              id="ajuste-redondeo"
              value={roundTo}
              onChange={(e) => {
                setRoundTo(e.target.value);
                invalidarPreview();
              }}
            >
              {REDONDEOS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-start gap-2 self-end text-sm text-gray-700">
            <input
              type="checkbox"
              checked={adjustCost}
              onChange={(e) => {
                setAdjustCost(e.target.checked);
                invalidarPreview();
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            />
            <span>
              Ajustar también el costo
              <span className="block text-gray-500">Con el mismo criterio, para conservar el margen.</span>
            </span>
          </label>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        {preview && (
          <div>
            {filasCambiadas.length === 0 ? (
              <Alert tone="warning">El ajuste no cambia ningún precio. Revisá el valor o el redondeo.</Alert>
            ) : (
              <>
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  {preview.changedCount === 1
                    ? '1 SKU cambia:'
                    : `${preview.changedCount} SKUs cambian:`}
                  {preview.unchangedCount > 0 && (
                    <span className="ml-1 font-normal text-gray-500">
                      ({preview.unchangedCount} sin cambios)
                    </span>
                  )}
                </p>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Producto / SKU</th>
                        <th className="px-3 py-2 font-semibold">Precio</th>
                        {adjustCost && <th className="px-3 py-2 font-semibold">Costo</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filasCambiadas.map((fila) => (
                        <tr key={fila.variantId ?? fila.sku}>
                          <td className="px-3 py-2">
                            <span className="block text-gray-900">{fila.productName}</span>
                            <span className="text-xs text-gray-500">
                              {fila.variantLabel ? `${fila.variantLabel} · ` : ''}
                              {fila.sku ?? 'Sin SKU'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono tabular-nums text-gray-600">
                            {formatCurrency(fila.oldPrice, fila.currency ?? undefined)}
                            <span className="mx-1 text-gray-400">→</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(fila.newPrice, fila.currency ?? undefined)}
                            </span>
                          </td>
                          {adjustCost && (
                            <td className="px-3 py-2 font-mono tabular-nums text-gray-600">
                              {formatCurrency(fila.oldCost, fila.currency ?? undefined)}
                              <span className="mx-1 text-gray-400">→</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(fila.newCost, fila.currency ?? undefined)}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={cerrar} disabled={aplicando}>
            Cancelar
          </Button>
          <Button
            onClick={listoParaAplicar ? aplicar : verCambios}
            isLoading={calculando || aplicando}
            disabled={aplicando}
            leftIcon={listoParaAplicar ? <Tags className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          >
            {listoParaAplicar
              ? `Aplicar a ${preview.changedCount} ${preview.changedCount === 1 ? 'SKU' : 'SKUs'}`
              : 'Ver cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkPriceModal;