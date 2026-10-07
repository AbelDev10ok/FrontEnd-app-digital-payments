type PaginaciónProps = {
    page: number;
    setPage: (page: number | ((page: number) => number)) => void;
    totalPages: number;
};

// como funciona este componente
// - Recibe la página actual (page), una función para actualizar la página (setPage) y el total de páginas (totalPages).
// - Muestra botones "Anterior" y "Siguiente" para navegar entre páginas.
// - Deshabilita el botón "Anterior" si está en la primera página (page === 0).
// - Deshabilita el botón "Siguiente" si está en la última página (page >= totalPages - 1).

const botonClase =
    'px-4 py-2 text-sm font-semibold text-brand-800 bg-white border border-gray-200 rounded-lg hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';

const Paginación: React.FC<PaginaciónProps> = ({ page, setPage, totalPages }) => {
    return (
        <div className="flex justify-between items-center mt-4">
            <button
                onClick={() => setPage((p: number) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={botonClase}
            >
                Anterior
            </button>
            <span className="text-sm text-gray-600 tabular-nums">
                Página {page + 1} de {totalPages}
            </span>
            <button
                onClick={() => setPage((p: number) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className={botonClase}
            >
                Siguiente
            </button>
        </div>
    );
};

export default Paginación;
