import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import Paginacion from './Paginacion';

const Wrapper = () => {
  const [page, setPage] = useState(0);
  return <Paginacion page={page} setPage={setPage} totalPages={3} />;
};

describe('Paginacion', () => {
  it('muestra la página actual y deshabilita Anterior en la primera página', () => {
    render(<Wrapper />);
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('Siguiente avanza una página', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('Anterior retrocede una página y Siguiente se deshabilita en la última', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });
});
