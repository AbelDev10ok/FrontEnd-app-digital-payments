import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { Client } from '@/shared/types/client';
import useCombobox from '@/shared/hooks/useCombobox';

interface Props {
  value?: string | number; // sellerId as string
  sellers: Client[];
  onChange: (sellerId: string) => void;
  placeholder?: string;
  error?: string;
}


// este campo es un automomplete para seleccionar un vendedor de una lista
const AutocompleteSeller: React.FC<Props> = ({ value, sellers, onChange, placeholder = 'Seleccionar vendedor', error }) => {
  const [search, setSearch] = useState('');
  // Selección optimista: muestra el chip al elegir aunque el padre aún no haya
  // propagado el nuevo value (y mientras se sincroniza, si el value no matchea)
  const [picked, setPicked] = useState<Client | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInputOnClear = useRef(false);
  const labelId = useId();
  const inputId = `${labelId}-input`;
  const errorId = `${labelId}-error`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter(s => s.name.toLowerCase().includes(q));
  }, [sellers, search]);

  const selected = sellers.find(s => String(s.id) === String(value)) ?? picked;

  const applyPick = (s: Client) => {
    onChange(String(s.id));
    setPicked(s);
    setSearch(s.name);
  };

  const { open, activeIndex, setActiveIndex, openList, closeList, handleKeyDown, listboxId, optionId, activeOptionId } = useCombobox({
    optionCount: filtered.length,
    onPick: (index) => {
      const s = filtered[index];
      if (s) applyPick(s);
    },
  });

  const clearSelection = () => {
    // El foco vuelve al campo de búsqueda para poder elegir otro vendedor.
    focusInputOnClear.current = true;
    setPicked(null);
    onChange('');
    setSearch('');
  };

  useEffect(() => {
    if (!selected && focusInputOnClear.current) {
      focusInputOnClear.current = false;
      inputRef.current?.focus();
    }
  }, [selected]);

  return (
    <div>
      {selected ? (
        <span id={labelId} className="text-sm font-medium text-gray-700 mb-2 block">
          Vendedor (opcional)
        </span>
      ) : (
        <label id={labelId} htmlFor={inputId} className="text-sm font-medium text-gray-700 mb-2 block">
          Vendedor (opcional)
        </label>
      )}

      {!selected && (
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            value={search}
            onChange={e => { setSearch(e.target.value); openList(); }}
            onClick={openList}
            onKeyDown={handleKeyDown}
            onBlur={closeList}
            placeholder={placeholder}
            className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl`}
          />
          <div aria-hidden="true" className="absolute left-3 top-3 text-gray-400"><User className="w-4 h-4"/></div>
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Sugerencias de vendedores"
            hidden={!open || filtered.length === 0}
            // Evita el blur del input al elegir con el mouse (incluida la barra de scroll).
            onMouseDown={e => e.preventDefault()}
            className="absolute z-20 bg-white border border-gray-200 rounded-xl mt-1 w-full max-h-40 overflow-y-auto"
          >
            {filtered.map((s, index) => (
              <li
                key={s.id}
                id={optionId(index)}
                role="option"
                aria-selected={String(s.id) === String(value)}
                className={`px-4 py-2 cursor-pointer ${index === activeIndex ? 'bg-brand-100' : 'hover:bg-brand-100'}`}
                onClick={() => { applyPick(s); closeList(); }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {s.name}
              </li>
            ))}
          </ul>
          {open && filtered.length === 0 && (
            <div role="status" className="absolute z-20 bg-white border border-gray-200 rounded-xl mt-1 w-full px-4 py-2 text-sm text-gray-500">
              Sin resultados
            </div>
          )}
        </div>
      )}

      {selected && (
        <div role="group" aria-labelledby={labelId} className="inline-flex items-center gap-2 mt-2 bg-brand-50 text-brand-800 px-3 py-1 rounded-full text-sm">
          <User className="w-4 h-4" />
          <span>{selected.name}</span>
          <button
            type="button"
            className="ml-2 text-brand-600 hover:text-brand-800"
            onClick={clearSelection}
            aria-label={`Quitar vendedor ${selected.name}`}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <p id={errorId} tabIndex={-1} data-error-message className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default AutocompleteSeller;
