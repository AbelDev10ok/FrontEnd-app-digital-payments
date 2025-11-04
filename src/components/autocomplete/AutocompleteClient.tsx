import React, { useMemo, useState } from 'react';
import { Client } from '../../services/clientServices';

interface Props {
  value?: number;
  clients: Client[];
  onChange: (clientId: number) => void;
  placeholder?: string;
  error?: string;
}

const AutocompleteClient: React.FC<Props> = ({ value, clients, onChange, placeholder = 'Buscar cliente', error }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  const selected = clients.find(c => c.id === Number(value));

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">Cliente *</label>
      {!selected && (
        <div className="relative">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl`}
          />
          <div className="absolute left-3 top-3 text-gray-400">👤</div>
          {open && filtered.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl mt-1 w-full max-h-40 overflow-y-auto">
              {filtered.map(c => (
                <li key={c.id} className="px-4 py-2 cursor-pointer hover:bg-indigo-100" onMouseDown={() => { onChange(c.id); setSearch(c.name); setOpen(false); }}>
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="inline-flex items-center gap-2 mt-2 bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full text-sm">
          <span>{selected.name}</span>
          <button type="button" className="ml-2 text-indigo-600 hover:text-indigo-800" onClick={() => onChange(0)}>
            ×
          </button>
        </div>
      )}

      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default AutocompleteClient;
