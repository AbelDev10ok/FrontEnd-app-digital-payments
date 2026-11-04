import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Tags, Trash2 } from 'lucide-react';
import { Alert, Button, Card, Field, Input } from '@/shared/components/ui';
import ConfirmDialog from '@/features/catalogo/components/ConfirmDialog';
import { salesService } from '@/features/ventas/services/salesServices';
import type { AttributeDto } from '@/shared/types/sales';

interface GestionAtributosProps {
  attributes: AttributeDto[];
  loading: boolean;
  loadError: string | null;
  onReload: () => Promise<void> | void;
  feedback: string | null;
  onFeedback: (mensaje: string | null) => void;
}

const GestionAtributos: React.FC<GestionAtributosProps> = ({
  attributes,
  loading,
  loadError,
  onReload,
  feedback,
  onFeedback,
}) => {
  const [attributeName, setAttributeName] = useState('');
  const [attributeValues, setAttributeValues] = useState('');
  const [attributeError, setAttributeError] = useState<string | null>(null);
  const [creatingAttribute, setCreatingAttribute] = useState(false);

  const [deleting, setDeleting] = useState<AttributeDto | null>(null);
  const [deletingAttributeId, setDeletingAttributeId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [nuevoValor, setNuevoValor] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => onFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback, onFeedback]);

  const handleSubmitAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingAttribute) return;
    const name = attributeName.trim();
    const values = attributeValues
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!name) {
      setAttributeError('Ingresá un nombre para el atributo');
      return;
    }
    if (values.length === 0) {
      setAttributeError('Cargá al menos un valor (separados por coma)');
      return;
    }
    setCreatingAttribute(true);
    setAttributeError(null);
    try {
      await salesService.createAttribute({ name, values });
      setAttributeName('');
      setAttributeValues('');
      onFeedback('Atributo creado');
      await onReload();
    } catch (err) {
      setAttributeError(err instanceof Error ? err.message : 'Error al guardar el atributo');
    } finally {
      setCreatingAttribute(false);
    }
  };

  const handleAddValue = async (attributeId: number) => {
    const value = (nuevoValor[attributeId] ?? '').trim();
    if (!value) return;
    setActionError(null);
    try {
      await salesService.addAttributeValue(attributeId, value);
      setNuevoValor((prev) => ({ ...prev, [attributeId]: '' }));
      onFeedback('Valor agregado');
      await onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al agregar el valor');
    }
  };

  const handleDeleteAttribute = async () => {
    if (!deleting || deletingAttributeId != null) return;
    setDeletingAttributeId(deleting.id);
    setActionError(null);
    try {
      await salesService.deleteAttribute(deleting.id);
      setDeleting(null);
      onFeedback('Atributo eliminado');
      await onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar el atributo');
      setDeleting(null);
    } finally {
      setDeletingAttributeId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-500">
            Definí qué características distinguen tus variantes (Color, Talle). Un producto puede generar sus
            variantes a partir de ellas.
          </p>
          <Button
            onClick={() => onReload()}
            variant="ghost"
            size="sm"
            aria-label="Recargar atributos"
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Recargar
          </Button>
        </div>

        {feedback && <Alert tone="success">{feedback}</Alert>}
        {actionError && <Alert tone="danger">{actionError}</Alert>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <form onSubmit={handleSubmitAttribute} noValidate className="self-start rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Nuevo atributo" htmlFor="attributeName" required error={attributeError ?? undefined}>
                <Input
                  id="attributeName"
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)}
                  placeholder="Ej: Color"
                />
              </Field>
              <Field label="Valores (separados por coma)" htmlFor="attributeValues">
                <Input
                  id="attributeValues"
                  value={attributeValues}
                  onChange={(e) => setAttributeValues(e.target.value)}
                  placeholder="Ej: Rojo, Azul, Negro"
                />
              </Field>
              <div>
                <Button type="submit" isLoading={creatingAttribute} leftIcon={<Plus className="w-4 h-4" />}>
                  Crear atributo
                </Button>
              </div>
            </div>
          </form>

          <div>
            {loading ? (
              <p role="status" className="text-sm text-gray-500">
                Cargando atributos...
              </p>
            ) : loadError ? (
              <Alert tone="danger">{loadError}</Alert>
            ) : attributes.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">No hay atributos registrados.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {attributes.map((attr) => (
                  <li key={attr.id} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Tags className="w-4 h-4 shrink-0 text-brand-600" />
                        <span className="truncate font-medium text-gray-900">{attr.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Eliminar atributo ${attr.name}`}
                        onClick={() => { setActionError(null); setDeleting(attr); }}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attr.values.map((valor) => (
                        <span
                          key={valor.id}
                          className="rounded-full border border-gray-200 bg-surface px-2 py-0.5 text-xs text-gray-600"
                        >
                          {valor.value}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          aria-label={`Agregar valor a ${attr.name}`}
                          value={nuevoValor[attr.id] ?? ''}
                          onChange={(e) => setNuevoValor((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                          placeholder="Agregar valor…"
                          className="h-9 text-sm"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleAddValue(attr.id)}>
                        Agregar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleting != null}
        title="Eliminar atributo"
        message={`¿Eliminar el atributo «${deleting?.name ?? ''}» y todos sus valores? Esta acción no se puede deshacer.`}
        isLoading={deletingAttributeId != null}
        onConfirm={handleDeleteAttribute}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
};

export default GestionAtributos;
