import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AutocompleteSeller from '../AutocompleteSeller';
import type { Client } from '@/shared/types/client';

const sellers: Client[] = [
  { id: 10, name: 'María López', telefono: '0981444444', email: 'maria@test.com', direccion: 'Calle 4', seller: true },
  { id: 20, name: 'Néstor Ojeda', telefono: '0981555555', email: 'nestor@test.com', direccion: 'Calle 5', seller: true },
];

const ControlledSeller = ({ initial }: { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return <AutocompleteSeller sellers={sellers} value={value} onChange={setValue} />;
};

describe('AutocompleteSeller', () => {
  it('asocia la etiqueta y el error con el campo de búsqueda', () => {
    render(<AutocompleteSeller sellers={sellers} onChange={vi.fn()} error="Selecciona un vendedor" />);
    const input = screen.getByRole('combobox', { name: 'Vendedor (opcional)' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const mensaje = screen.getByText('Selecciona un vendedor');
    expect(input.getAttribute('aria-describedby')).toBe(mensaje.id);
  });

  it('recorre las opciones con el teclado y selecciona con Enter', async () => {
    const user = userEvent.setup();
    render(<ControlledSeller />);
    const input = screen.getByRole('combobox', { name: 'Vendedor (opcional)' });

    await user.click(input);
    await user.keyboard('{ArrowUp}');
    // ↑ desde el inicio salta a la última opción
    const options = screen.getAllByRole('option');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);

    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Quitar vendedor Néstor Ojeda' })).toBeInTheDocument();
  });

  it('el botón para quitar la selección tiene nombre accesible y limpia el valor', async () => {
    const user = userEvent.setup();
    render(<ControlledSeller initial="10" />);

    await user.click(screen.getByRole('button', { name: 'Quitar vendedor María López' }));
    // limpiada la selección, vuelve el campo de búsqueda
    expect(screen.getByRole('combobox', { name: 'Vendedor (opcional)' })).toBeInTheDocument();
  });

  it('acepta value numérico y lo compara con el id del vendedor', () => {
    render(<AutocompleteSeller sellers={sellers} value={10} onChange={vi.fn()} />);
    expect(screen.getByText('María López')).toBeInTheDocument();
  });
});
