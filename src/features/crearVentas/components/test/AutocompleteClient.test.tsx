import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AutocompleteClient from '../AutocompleteClient';
import type { Client } from '@/shared/types/client';

const clients: Client[] = [
  { id: 1, name: 'Ana Pérez', telefono: '0981111111', email: 'ana@test.com', direccion: 'Calle 1', seller: false },
  { id: 2, name: 'Benito Ruiz', telefono: '0981222222', email: 'benito@test.com', direccion: 'Calle 2', seller: false },
  { id: 3, name: 'Carla Sosa', telefono: '0981333333', email: 'carla@test.com', direccion: 'Calle 3', seller: false },
];

const ControlledClient = ({ initial }: { initial?: number }) => {
  const [value, setValue] = useState<number | undefined>(initial);
  return <AutocompleteClient clients={clients} value={value} onChange={setValue} />;
};

describe('AutocompleteClient', () => {
  it('asocia la etiqueta y el error con el campo de búsqueda', () => {
    render(<AutocompleteClient clients={clients} onChange={vi.fn()} error="Selecciona un cliente" />);
    const input = screen.getByRole('combobox', { name: 'Cliente *' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const mensaje = screen.getByText('Selecciona un cliente');
    expect(input.getAttribute('aria-describedby')).toBe(mensaje.id);
  });

  it('abre el listado con las flechas y selecciona con Enter', async () => {
    const user = userEvent.setup();
    render(<ControlledClient />);
    const input = screen.getByRole('combobox', { name: 'Cliente *' });

    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeVisible();
    expect(input).toHaveAttribute('aria-expanded', 'true');

    const options = screen.getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['Ana Pérez', 'Benito Ruiz', 'Carla Sosa']);
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);

    await user.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);

    await user.keyboard('{Enter}');
    // la opción elegida queda como selección visible y el listado se cierra
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Quitar cliente Benito Ruiz' })).toBeInTheDocument();
  });

  it('muestra el chip de inmediato aunque el padre aún no propague el value', async () => {
    const user = userEvent.setup();
    // onChange no propaga el value: el chip debe aparecer igual (selección optimista)
    render(<AutocompleteClient clients={clients} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox', { name: 'Cliente *' }));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('button', { name: 'Quitar cliente Ana Pérez' })).toBeInTheDocument();
  });

  it('Esc cierra el listado sin seleccionar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AutocompleteClient clients={clients} onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Cliente *' });

    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeVisible();

    await user.keyboard('{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('Enter sin opción resaltada no selecciona ni envía el formulario', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <AutocompleteClient clients={clients} onChange={onChange} />
        <button type="submit">Guardar</button>
      </form>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Cliente *' }));
    await user.keyboard('an');
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('filtra las opciones al escribir y muestra un estado vacío', async () => {
    const user = userEvent.setup();
    render(<AutocompleteClient clients={clients} onChange={vi.fn()} />);
    await user.type(screen.getByRole('combobox', { name: 'Cliente *' }), 'car');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Carla Sosa');

    await user.clear(screen.getByRole('combobox', { name: 'Cliente *' }));
    await user.type(screen.getByRole('combobox', { name: 'Cliente *' }), 'zzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('el botón para quitar la selección tiene nombre accesible y limpia el valor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AutocompleteClient clients={clients} value={1} onChange={onChange} />);

    const quitar = screen.getByRole('button', { name: 'Quitar cliente Ana Pérez' });
    await user.click(quitar);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('la selección con el mouse usa las mismas opciones accesibles', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AutocompleteClient clients={clients} onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Cliente *' }));
    await user.click(screen.getByRole('option', { name: 'Carla Sosa' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
