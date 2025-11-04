import React, { useMemo, useState } from 'react';
import { Client } from '../../services/clientServices';
import { User } from 'lucide-react';

interface Props {
  value?: string; // sellerId as string
  sellers: Client[];
  onChange: (sellerId: string) => void;
  placeholder?: string;
  error?: string;
}

// placeholder is optional and omitted by default because this field is optional in the form
const AutocompleteSeller: React.FC<Props> = ({ value, sellers, onChange, placeholder = 'Seleccionar vendedor', error }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter(s => s.name.toLowerCase().includes(q));
  }, [sellers, search]);

  const selected = sellers.find(s => String(s.id) === String(value));

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">Vendedor (opcional)</label>
      {!selected && (
        <div className="relative">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl`}
          />
          <div className="absolute left-3 top-3 text-gray-400"><User className="w-4 h-4"/></div>
          {open && filtered.length > 0 && (
            <ul className="absolute z-20 bg-white border border-gray-200 rounded-xl mt-1 w-full max-h-40 overflow-y-auto">
              {filtered.map(s => (
                <li key={s.id} className="px-4 py-2 cursor-pointer hover:bg-indigo-100" onMouseDown={() => { onChange(String(s.id)); setSearch(s.name); setOpen(false); }}>
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="inline-flex items-center gap-2 mt-2 bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full text-sm">
          <User className="w-4 h-4" />
          <span>{selected.name}</span>
          <button type="button" className="ml-2 text-indigo-600 hover:text-indigo-800" onClick={() => onChange('')}>
            ×
          </button>
        </div>
      )}

      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default AutocompleteSeller;
