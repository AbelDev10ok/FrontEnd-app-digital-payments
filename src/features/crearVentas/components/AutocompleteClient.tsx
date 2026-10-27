import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { Client } from '@/shared/types/client';
import useCombobox from '@/shared/hooks/useCombobox';

interface Props {
  value?: number;
  clients: Client[];
  onChange: (clientId: number) => void;
  placeholder?: string;
  error?: string;
}

const AutocompleteClient: React.FC<Props> = ({ value, clients, onChange, placeholder = 'Buscar cliente', error }) => {
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
    if (!q) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  const selected = clients.find(c => c.id === Number(value)) ?? picked;

  const applyPick = (c: Client) => {
    onChange(c.id);
    setPicked(c);
    setSearch(c.name);
  };

  const { open, activeIndex, setActiveIndex, openList, closeList, handleKeyDown, listboxId, optionId, activeOptionId } = useCombobox({
    optionCount: filtered.length,
    onPick: (index) => {
      const c = filtered[index];
      if (c) applyPick(c);
    },
  });

  const clearSelection = () => {
    // El foco vuelve al campo de búsqueda para poder elegir otro cliente.
    focusInputOnClear.current = true;
    setPicked(null);
    onChange(0);
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
          Cliente *
        </span>
      ) : (
        <label id={labelId} htmlFor={inputId} className="text-sm font-medium text-gray-700 mb-2 block">
          Cliente *
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
            aria-required="true"
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            value={search}
            onChange={e => { setSearch(e.target.value); openList(); }}
            onClick={openList}
            onKeyDown={handleKeyDown}
            onBlur={closeList}
            placeholder={placeholder}
            className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-input placeholder:text-gray-500`}
          />
          <div aria-hidden="true" className="absolute left-3 top-3 text-gray-400">
            <User className="w-4 h-4" />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Sugerencias de clientes"
            hidden={!open || filtered.length === 0}
            // Evita el blur del input al elegir con el mouse (incluida la barra de scroll).
            onMouseDown={e => e.preventDefault()}
            className="absolute z-10 bg-white border border-gray-200 rounded-xl shadow-card mt-1 w-full max-h-40 overflow-y-auto"
          >
            {filtered.map((c, index) => (
              <li
                key={c.id}
                id={optionId(index)}
                role="option"
                aria-selected={c.id === Number(value)}
                className={`px-4 py-2 cursor-pointer ${index === activeIndex ? 'bg-brand-100' : 'hover:bg-brand-100'}`}
                onClick={() => { applyPick(c); closeList(); }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {c.name}
                {c.sellerName && (
                  <span className="ml-2 text-xs text-gray-400">· {c.sellerName}</span>
                )}
              </li>
            ))}
          </ul>
          {open && filtered.length === 0 && (
            <div role="status" className="absolute z-10 bg-white border border-gray-200 rounded-xl shadow-card mt-1 w-full px-4 py-2 text-sm text-gray-500">
              Sin resultados
            </div>
          )}
        </div>
      )}

      {selected && (
        <div role="group" aria-labelledby={labelId} className="inline-flex items-center gap-2 mt-2 bg-brand-50 text-brand-800 px-3 py-1 rounded-full text-sm">
          <span>{selected.name}</span>
          <button
            type="button"
            // 24×24 de área de toque (WCAG 2.5.8); el glifo sigue chico
            className="-mr-1 ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base leading-none text-brand-600 hover:bg-brand-100 hover:text-brand-800"
            onClick={clearSelection}
            aria-label={`Quitar cliente ${selected.name}`}
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

export default AutocompleteClient;
