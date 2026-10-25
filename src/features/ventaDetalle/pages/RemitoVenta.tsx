import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { salesService } from '@/features/ventas/services/salesServices';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { Button } from '@/shared/components/ui';
import Card from '@/shared/components/ui/Card';
import Load from '@/shared/components/feedback/Load';
import type { SaleDocumentDto } from '@/shared/types/sales';

const formatearFecha = (fecha: string) => {
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
};

const formatearFechaHora = (fecha: string) => {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  const pad = (numero: number) => String(numero).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Vista imprimible del remito, fuera del layout del dashboard: al imprimir
 * solo queda el documento A4. No abre el diálogo de impresión automáticamente.
 */
export default function RemitoVenta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [documento, setDocumento] = useState<SaleDocumentDto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (!id) return;
      try {
        setCargando(true);
        setError(null);
        const remito = await salesService.getRemito(Number(id));
        if (!activo) return;
        setDocumento(remito);
      } catch (err) {
        if (!activo) return;
        setError(err instanceof Error ? err.message : 'Error al cargar el remito');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [id]);

  // El título define el nombre sugerido al usar «Guardar como PDF».
  useEffect(() => {
    if (!documento) return;
    const anterior = document.title;
    document.title = `Remito N° ${documento.numberLabel} · ${documento.businessName}`;
    return () => {
      document.title = anterior;
    };
  }, [documento]);

  const volver = () => navigate(`/dashboard/ventas/${id}`);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
        <Load message="Cargando remito..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-lg font-bold text-brand-950">
            No se pudo cargar el remito
          </h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button className="mt-6" variant="secondary" onClick={volver}>
            Volver a la venta
          </Button>
        </Card>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-lg font-bold text-brand-950">
            Esta venta todavía no tiene remito
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Emitilo desde el detalle de la venta: el número se asigna al
            confirmar y después podés reimprimirlo cuando quieras.
          </p>
          <Button className="mt-6" variant="secondary" onClick={volver}>
            Volver a la venta
          </Button>
        </Card>
      </div>
    );
  }

  const moneda = documento.currency ?? undefined;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-[210mm] px-4 print:max-w-none print:px-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={volver}
          >
            Volver a la venta
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <p className="text-sm text-gray-500">
              Para guardar como PDF, elegí «Guardar como PDF» en el diálogo de
              impresión.
            </p>
            <Button
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Imprimir
            </Button>
          </div>
        </div>

        <article className="mx-auto bg-white p-10 shadow-card print:max-w-none print:p-0 print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-8 border-b-2 border-brand-900 pb-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Comprobante de entrega
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-950">
                {documento.businessName}
              </h1>
              <div className="mt-2 space-y-0.5 text-sm text-gray-600">
                {documento.businessAddress && <p>{documento.businessAddress}</p>}
                {documento.businessTaxId && <p>CUIT: {documento.businessTaxId}</p>}
                {documento.businessPhone && <p>Tel.: {documento.businessPhone}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold tracking-tight text-brand-950">
                REMITO
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                N° {documento.numberLabel}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Emisión: {formatearFechaHora(documento.issuedAt)}
              </p>
              <p className="text-sm text-gray-500">
                Venta N° {documento.saleId} · {formatearFecha(documento.saleDate)}
              </p>
            </div>
          </header>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cliente
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {documento.clientName}
              </p>
              <div className="mt-1 space-y-0.5 text-sm text-gray-600">
                {documento.clientDoc && <p>DNI: {documento.clientDoc}</p>}
                {documento.clientAddress && <p>Dirección: {documento.clientAddress}</p>}
                {documento.clientPhone && <p>Teléfono: {documento.clientPhone}</p>}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Referencia
              </p>
              <div className="mt-1 space-y-0.5 text-sm text-gray-600">
                <p>Venta N° {documento.saleId}</p>
                <p>Fecha de venta: {formatearFecha(documento.saleDate)}</p>
                <p>Moneda: {documento.currency ?? 'ARS'}</p>
              </div>
            </div>
          </section>

          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-gray-300 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="w-16 py-2 pr-3 text-right">Cant.</th>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2 text-right">Precio unit.</th>
                <th className="py-2 pl-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 align-top">
                <td className="py-3 pr-3 text-right font-mono tabular-nums">
                  {documento.quantity}
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-gray-900">{documento.productName}</p>
                  {documento.variantLabel && (
                    <p className="mt-0.5 text-gray-500">{documento.variantLabel}</p>
                  )}
                </td>
                <td className="px-3 py-3 font-mono text-gray-600">
                  {documento.sku ?? '—'}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {formatCurrency(documento.unitPrice, moneda)}
                </td>
                <td className="py-3 pl-3 text-right font-mono tabular-nums">
                  {formatCurrency(documento.subtotal, moneda)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(documento.subtotal, moneda)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-brand-950">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(documento.total, moneda)}
                </span>
              </div>
            </div>
          </div>

          {documento.notes && (
            <section className="mt-6 rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Observaciones
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                {documento.notes}
              </p>
            </section>
          )}

          <section className="mt-12 grid grid-cols-2 gap-12 text-sm text-gray-600">
            <div>
              <div className="border-t border-gray-400 pt-2 text-center">
                Entregado por
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 text-center">
                Recibido por
              </div>
            </div>
          </section>

          <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
            <p>Documento no válido como factura.</p>
            <p className="mt-1">
              Remito N° {documento.numberLabel} · Venta N° {documento.saleId} ·
              Emitido el {formatearFechaHora(documento.issuedAt)}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
