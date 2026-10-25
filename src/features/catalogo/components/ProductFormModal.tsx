import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import { Alert, Button, Field, Input, Select } from '@/shared/components/ui';
import ErrorAnnouncer from '@/shared/components/feedback/ErrorAnnouncer';
import useFormErrorA11y from '@/shared/hooks/useFormErrorA11y';
import { salesService } from '@/features/ventas/services/salesServices';
import type {
  AttributeDto,
  ProductDto,
  ProductPayload,
  ProductTypeDto,
} from '@/shared/types/sales';
import { formatCurrency, getCurrency } from '@/shared/utils/formatCurrency';
import { etiquetaMoneda, opcionesMonedaNegocio } from '@/shared/utils/currencies';
import { aplanarCategorias } from '@/shared/utils/categoryTree';

/** Tope de combinaciones al generar variantes: evita explotar la pantalla. */
const MAX_COMBINACIONES = 200;

interface VariantRowState {
  id?: number;
  sku: string;
  cost: string;
  price: string;
  stock: string;
  barcode: string;
  active: boolean;
  /** attributeId (string) → attributeValueId (string) */
  valores: Record<string, string>;
}

const nuevaVariante = (): VariantRowState => ({
  sku: '',
  cost: '',
  price: '',
  stock: '0',
  barcode: '',
  active: true,
  valores: {},
});

const mismaCombinacion = (a: Record<string, string>, b: Record<string, string>) => {
  const claves = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const clave of claves) {
    if ((a[clave] ?? '') !== (b[clave] ?? '')) return false;
  }
  return true;
};

/**
 * Genera las filas de variantes como producto cartesiano de los valores de los
 * atributos elegidos, conservando lo ya cargado cuando la combinación se repite.
 * Devuelve `null` si no se pueden generar (algún atributo sin valores o
 * demasiadas combinaciones).
 */
const construirFilas = (
  attributeIds: string[],
  attributes: AttributeDto[],
  previas: VariantRowState[],
): VariantRowState[] | null => {
  if (attributeIds.length === 0) {
    return [previas[0] ? { ...previas[0], valores: {} } : nuevaVariante()];
  }

  const listas = attributeIds
    .map((id) => attributes.find((a) => String(a.id) === id))
    .filter((a): a is AttributeDto => a != null && a.values.length > 0)
    .map((a) => ({ attributeId: String(a.id), values: a.values }));

  // Algún atributo elegido todavía no tiene valores cargados
  if (listas.length !== attributeIds.length) return null;

  let combos: Array<Record<string, string>> = [{}];
  for (const { attributeId, values } of listas) {
    const siguiente: Array<Record<string, string>> = [];
    for (const combo of combos) {
      for (const valor of values) {
        siguiente.push({ ...combo, [attributeId]: String(valor.id) });
      }
    }
    combos = siguiente;
    if (combos.length > MAX_COMBINACIONES) return null;
  }

  return combos.map((combo) => {
    const previa = previas.find((p) => mismaCombinacion(p.valores, combo));
    return previa ? { ...previa, valores: combo } : { ...nuevaVariante(), valores: combo };
  });
};

const etiquetaVariante = (row: VariantRowState, attributes: AttributeDto[]) =>
  attributes
    .filter((a) => row.valores[String(a.id)])
    .map((a) => a.values.find((v) => String(v.id) === row.valores[String(a.id)])?.value ?? '')
    .filter(Boolean)
    .join(' / ');

interface ProductFormModalProps {
  isOpen: boolean;
  /** Filas del producto a editar (una por SKU); `null` abre el alta. */
  editingRows: ProductDto[] | null;
  categories: ProductTypeDto[];
  attributes: AttributeDto[];
  onClose: () => void;
  /** Se llama tras guardar con el mensaje de éxito a mostrar en la vista. */
  onSaved: (mensaje: string) => void;
}

/**
 * Alta y edición de productos en panel dedicado. El formulario se monta sólo
 * cuando el modal está abierto, así cada alta/edición arranca limpio.
 */
const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  editingRows,
  categories,
  attributes,
  onClose,
  onSaved,
}) => {
  const editingId = editingRows?.[0]?.id ?? null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId != null ? 'Editar producto' : 'Nuevo producto'}
      size="xl"
    >
      {isOpen && (
        <ProductForm
          key={editingId ?? 'nuevo'}
          editingRows={editingRows}
          categories={categories}
          attributes={attributes}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
};

interface ProductFormProps {
  editingRows: ProductDto[] | null;
  categories: ProductTypeDto[];
  attributes: AttributeDto[];
  onClose: () => void;
  onSaved: (mensaje: string) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  editingRows,
  categories,
  attributes,
  onClose,
  onSaved,
}) => {
  const editingId = editingRows?.[0]?.id ?? null;
  const base = editingRows?.[0] ?? null;

  const [productName, setProductName] = useState(base?.name ?? '');
  const [productDescription, setProductDescription] = useState(base?.description ?? '');
  const [productBrand, setProductBrand] = useState(base?.brand ?? '');
  const [productTypeId, setProductTypeId] = useState(
    base?.productTypeId != null ? String(base.productTypeId) : '',
  );
  const [productActive, setProductActive] = useState(base ? base.productActive !== false : true);
  // Moneda de los precios: se elige al crear y queda fija. Vacío = todavía no
  // eligió (se muestra la del negocio como sugerencia).
  const [productCurrency, setProductCurrency] = useState(base?.currency ?? '');

  // Los atributos del producto se derivan de los valores de sus variantes
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(() => {
    if (!editingRows) return [];
    return Array.from(
      new Set(editingRows.flatMap((f) => (f.attributes ?? []).map((a) => String(a.attributeId)))),
    );
  });
  const [variants, setVariants] = useState<VariantRowState[]>(() =>
    editingRows
      ? editingRows.map((fila) => ({
          id: fila.variantId ?? undefined,
          sku: fila.sku ?? '',
          cost: fila.cost != null ? String(fila.cost) : '',
          price: fila.price != null ? String(fila.price) : '',
          stock: fila.stock != null ? String(fila.stock) : '0',
          barcode: fila.barcode ?? '',
          // Estado propio de la variante: usar el combinado (active) haría que
          // activar solo el producto guarde la variante como inactiva.
          active: fila.variantActive !== false,
          valores: Object.fromEntries(
            (fila.attributes ?? []).map((a) => [String(a.attributeId), String(a.attributeValueId)]),
          ),
        }))
      : [nuevaVariante()],
  );

  // Errores por campo (envío) y aviso de interacción (p. ej. quitar la única variante)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sólo se asignan categorías hoja: las que agrupan subcategorías no se eligen
  // (salvo la categoría actual de un producto viejo, que se conserva al editar).
  const opcionesCategoria = useMemo(() => aplanarCategorias(categories), [categories]);
  const categoriaSeleccionada =
    opcionesCategoria.find((cat) => String(cat.id) === productTypeId) ?? null;
  const hayCategoriasHoja = opcionesCategoria.some((cat) => !cat.tieneHijas);
  const { formRef, errorAnnouncement, reportErrors } = useFormErrorA11y();

  const aplicarAtributosSeleccionados = (ids: string[]) => {
    setSelectedAttributeIds(ids);
    const filas = construirFilas(ids, attributes, variants);
    if (filas == null) {
      setAviso(
        `No se pudieron generar las variantes: revisá que los atributos tengan valores (máximo ${MAX_COMBINACIONES} combinaciones)`,
      );
      return;
    }
    setAviso(null);
    setVariants(filas);
  };

  const updateVariantRow = (indice: number, cambios: Partial<VariantRowState>) => {
    setVariants((previas) => previas.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)));
  };

  const handleValorAtributoChange = (indice: number, attributeId: string, valueId: string) => {
    setVariants((previas) =>
      previas.map((fila, i) =>
        i === indice ? { ...fila, valores: { ...fila.valores, [attributeId]: valueId } } : fila,
      ),
    );
  };

  const handleAgregarVariante = () => {
    if (selectedAttributeIds.length === 0) {
      setAviso('Un producto sin atributos tiene una sola variante: agregá atributos para vender variantes');
      return;
    }
    const nueva = { ...nuevaVariante() };
    if (selectedAttributeIds.some((id) => !nueva.valores[id])) {
      // Se completa con el primer valor de cada atributo elegido
      selectedAttributeIds.forEach((id) => {
        const atributo = attributes.find((a) => String(a.id) === id);
        if (atributo?.values[0]) nueva.valores[id] = String(atributo.values[0].id);
      });
    }
    if (variants.some((fila) => mismaCombinacion(fila.valores, nueva.valores))) {
      setAviso('Ya hay una variante con esa combinación de atributos');
      return;
    }
    setAviso(null);
    setVariants([...variants, nueva]);
  };

  const handleQuitarVariante = (indice: number) => {
    if (variants.length <= 1) {
      setAviso('El producto debe tener al menos una variante');
      return;
    }
    setAviso(null);
    setVariants(variants.filter((_, i) => i !== indice));
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const nuevosErrores: Record<string, string> = {};
    const name = productName.trim();
    if (!name) nuevosErrores.name = 'Ingresá un nombre para el producto';
    if (!productTypeId) nuevosErrores.productTypeId = 'Elegí una categoría';
    if (variants.length === 0) nuevosErrores.variants = 'El producto debe tener al menos una variante';

    const payloadVariants = [];
    for (let i = 0; i < variants.length; i++) {
      const fila = variants[i];
      const cost = Number(fila.cost);
      const price = Number(fila.price);
      const stock = Number(fila.stock);
      const etiqueta = etiquetaVariante(fila, attributes) || `variante ${i + 1}`;
      if (fila.cost === '' || !Number.isFinite(cost) || cost < 0) {
        nuevosErrores[`v${i}-cost`] = `El costo de ${etiqueta} debe ser un número mayor o igual a 0`;
      }
      if (fila.price === '' || !Number.isFinite(price) || price <= 0) {
        nuevosErrores[`v${i}-price`] = `El precio de venta de ${etiqueta} debe ser mayor a 0`;
      } else if (price <= cost) {
        nuevosErrores[`v${i}-price`] = `El precio de venta de ${etiqueta} debe ser mayor al costo`;
      }
      if (fila.stock === '' || !Number.isInteger(stock) || stock < 0) {
        nuevosErrores[`v${i}-stock`] = `El stock de ${etiqueta} debe ser un número entero mayor o igual a 0`;
      }
      if (selectedAttributeIds.some((attributeId) => !fila.valores[attributeId])) {
        nuevosErrores[`v${i}-valores`] = `Elegí el valor de cada atributo en ${etiqueta}`;
      }
      payloadVariants.push({
        ...(fila.id != null ? { id: fila.id } : {}),
        sku: fila.sku.trim() || null,
        cost,
        price,
        stock,
        barcode: fila.barcode.trim() || null,
        active: fila.active,
        attributeValueIds: selectedAttributeIds
          .map((attributeId) => Number(fila.valores[attributeId]))
          .filter((id) => Number.isFinite(id)),
      });
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      reportErrors(nuevosErrores);
      return;
    }

    const payload: ProductPayload = {
      name,
      description: productDescription.trim() || null,
      brand: productBrand.trim() || null,
      active: productActive,
      productTypeId: Number(productTypeId),
      attributeIds: selectedAttributeIds.map(Number),
      variants: payloadVariants,
      // La moneda sólo se elige al crear; en la edición se repite la del producto.
      ...(editingId == null ? { currency: productCurrency || getCurrency() } : {}),
    };

    setSaving(true);
    setErrors({});
    setAviso(null);
    try {
      if (editingId != null) {
        await salesService.updateProduct(editingId, payload);
        onSaved('Producto actualizado');
      } else {
        await salesService.createProduct(payload);
        onSaved('Producto creado');
      }
      onClose();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmitProduct} noValidate>
      <ErrorAnnouncer message={errorAnnouncement} />

      {/* 1) Datos del producto */}
      <section aria-label="Datos del producto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">Datos del producto</p>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <Field label="Nombre del producto" htmlFor="productName" required error={errors.name}>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Heladera Samsung 320L"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Descripción (opcional)" htmlFor="productDescription">
              <Input
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Ej: 320 litros, no frost"
              />
            </Field>
            <Field label="Marca (opcional)" htmlFor="productBrand">
              <Input
                id="productBrand"
                value={productBrand}
                onChange={(e) => setProductBrand(e.target.value)}
                placeholder="Ej: Samsung"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Categoría" htmlFor="productTypeId" required error={errors.productTypeId}>
              <Select id="productTypeId" value={productTypeId} onChange={(e) => setProductTypeId(e.target.value)}>
                <option value="">Selecciona una categoría</option>
                {opcionesCategoria.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    // Los productos van en hojas; la categoría actual se mantiene
                    // aunque agrupe, para no romper datos viejos.
                    disabled={cat.tieneHijas && String(cat.id) !== productTypeId}
                  >
                    {'— '.repeat(cat.depth)}
                    {cat.name}
                    {cat.tieneHijas ? ' (tiene subcategorías)' : ''}
                  </option>
                ))}
              </Select>
              {categoriaSeleccionada?.tieneHijas && (
                <p className="mt-1.5 text-sm text-amber-600">
                  «{categoriaSeleccionada.name}» agrupa subcategorías: elegí una subcategoría para el
                  producto.
                </p>
              )}
              {!hayCategoriasHoja && !categoriaSeleccionada?.tieneHijas && opcionesCategoria.length > 0 && (
                <p className="mt-1.5 text-sm text-gray-500">
                  No hay categorías hoja: creá una subcategoría para poder asignar productos.
                </p>
              )}
            </Field>
            <Field
              label="Moneda del precio"
              htmlFor="productCurrency"
              hint={editingId != null ? 'Se fija al crear el producto' : undefined}
            >
              <Select
                id="productCurrency"
                value={productCurrency || getCurrency()}
                onChange={(e) => setProductCurrency(e.target.value)}
                disabled={editingId != null}
              >
                {opcionesMonedaNegocio(productCurrency || getCurrency()).map((m) => (
                  <option key={m} value={m}>
                    {etiquetaMoneda(m)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estado" htmlFor="productActive">
              <Select
                id="productActive"
                value={productActive ? 'activo' : 'inactivo'}
                onChange={(e) => setProductActive(e.target.value === 'activo')}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo (no se puede vender)</option>
              </Select>
            </Field>
          </div>
        </div>
      </section>

      {/* 2) Atributos que generan variantes */}
      <section aria-label="Atributos que generan variantes" className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
          Atributos que generan variantes
        </p>
        {attributes.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Todavía no hay atributos. Creá uno (por ejemplo Color o Talle) para vender variantes.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {attributes.map((attr) => {
              const activo = selectedAttributeIds.includes(String(attr.id));
              return (
                <button
                  key={attr.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() =>
                    aplicarAtributosSeleccionados(
                      activo
                        ? selectedAttributeIds.filter((id) => id !== String(attr.id))
                        : [...selectedAttributeIds, String(attr.id)],
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activo
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {attr.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3) Variantes: una fila por SKU */}
      <section aria-label="Variantes" className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
            Variantes ({variants.length})
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarVariante} leftIcon={<Plus className="w-4 h-4" />}>
            Agregar
          </Button>
        </div>

        <div className="mt-2 rounded-xl border border-gray-200">
          {variants.map((fila, indice) => {
            const price = Number(fila.price);
            const cost = Number(fila.cost);
            const margen =
              fila.price !== '' && fila.cost !== '' && Number.isFinite(price) && Number.isFinite(cost) && price > cost
                ? price - cost
                : null;
            return (
              <div
                key={indice}
                className="p-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="flex flex-wrap items-end gap-2">
                    {selectedAttributeIds.map((attributeId) => {
                      const atributo = attributes.find((a) => String(a.id) === attributeId);
                      if (!atributo) return null;
                      return (
                        <label key={attributeId} className="text-xs text-gray-600">
                          <span className="block font-medium mb-1">{atributo.name}</span>
                          <Select
                            aria-label={`${atributo.name} de la variante ${indice + 1}`}
                            value={fila.valores[attributeId] ?? ''}
                            onChange={(e) => handleValorAtributoChange(indice, attributeId, e.target.value)}
                            className="h-9 text-sm"
                          >
                            <option value="">Elegir</option>
                            {atributo.values.map((valor) => (
                              <option key={valor.id} value={valor.id}>
                                {valor.value}
                              </option>
                            ))}
                          </Select>
                        </label>
                      );
                    })}
                    {selectedAttributeIds.length === 0 && (
                      <span className="text-xs text-gray-500 self-center">
                        Producto simple: una sola variante sin atributos
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Quitar variante ${indice + 1}`}
                    onClick={() => handleQuitarVariante(indice)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {errors[`v${indice}-valores`] && (
                  <p id={`v${indice}-valores-error`} tabIndex={-1} data-error-message className="mt-2 text-sm text-red-600">
                    {errors[`v${indice}-valores`]}
                  </p>
                )}

                <div className="mt-2 grid grid-cols-2 lg:grid-cols-5 gap-2">
                  <Field label="SKU (opcional)" htmlFor={`sku-${indice}`}>
                    <Input
                      id={`sku-${indice}`}
                      value={fila.sku}
                      onChange={(e) => updateVariantRow(indice, { sku: e.target.value })}
                      placeholder="Se genera solo"
                    />
                  </Field>
                  <Field label="Costo" htmlFor={`cost-${indice}`} required error={errors[`v${indice}-cost`]}>
                    <Input
                      id={`cost-${indice}`}
                      type="number"
                      value={fila.cost}
                      onChange={(e) => updateVariantRow(indice, { cost: e.target.value })}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Precio de venta" htmlFor={`price-${indice}`} required error={errors[`v${indice}-price`]}>
                    <Input
                      id={`price-${indice}`}
                      type="number"
                      value={fila.price}
                      onChange={(e) => updateVariantRow(indice, { price: e.target.value })}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Stock" htmlFor={`stock-${indice}`} required error={errors[`v${indice}-stock`]}>
                    <Input
                      id={`stock-${indice}`}
                      type="number"
                      value={fila.stock}
                      onChange={(e) => updateVariantRow(indice, { stock: e.target.value })}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Código de barras" htmlFor={`barcode-${indice}`}>
                    <Input
                      id={`barcode-${indice}`}
                      value={fila.barcode}
                      onChange={(e) => updateVariantRow(indice, { barcode: e.target.value })}
                      placeholder="Opcional"
                    />
                  </Field>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={fila.active}
                      onChange={(e) => updateVariantRow(indice, { active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Variante activa
                  </label>
                  {margen != null && (
                    <span className="text-xs text-gray-500 font-mono tabular-nums">
                      Margen por unidad: {formatCurrency(margen, productCurrency || getCurrency())}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {errors.variants && (
        <p tabIndex={-1} data-error-message className="mt-2 text-sm text-red-600">
          {errors.variants}
        </p>
      )}
      {aviso && (
        <div className="mt-4">
          <Alert tone="danger">{aviso}</Alert>
        </div>
      )}

      <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-2 border-t border-gray-100 bg-white px-6 pb-6 pt-4 after:absolute after:inset-x-0 after:top-full after:h-6 after:bg-white after:content-['']">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={saving} leftIcon={<Plus className="w-4 h-4" />}>
          {editingId != null ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
};

export default ProductFormModal;
