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


const Paginación: React.FC<PaginaciónProps> = ({ page, setPage, totalPages }) => {
    return (
        <div className="flex justify-between items-center mt-4">
            <button
            onClick={() => setPage((p: number) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Anterior
        </button>
        <span className="text-sm text-gray-700">
             Página {page + 1} de {totalPages}
        </span>
        <button
            onClick={() => setPage((p: number) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Siguiente
        </button>
        </div>
    )

}

export default Paginación;
