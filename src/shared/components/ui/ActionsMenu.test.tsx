import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ActionsMenu from './ActionsMenu';

const renderMenu = (onEditar = vi.fn(), onEliminar = vi.fn()) => {
  render(
    <ActionsMenu
      label="Acciones de la venta #10"
      items={[
        { label: 'Editar', onSelect: onEditar },
        { label: 'Eliminar', tone: 'danger', onSelect: onEliminar },
      ]}
    />,
  );
  return { onEditar, onEliminar };
};

const abrir = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Acciones de la venta #10' }));

describe('ActionsMenu', () => {
  it('arranca cerrado y expone el nombre accesible del botón', () => {
    renderMenu();

    const boton = screen.getByRole('button', { name: 'Acciones de la venta #10' });
    expect(boton).toHaveAttribute('aria-haspopup', 'menu');
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('abre el menú con las opciones y enfoca la primera', () => {
    renderMenu();

    abrir();

    expect(screen.getByRole('menu', { name: 'Acciones de la venta #10' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Acciones de la venta #10' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('ejecuta la opción elegida y cierra el menú', () => {
    const { onEditar } = renderMenu();

    abrir();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));

    expect(onEditar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('cierra con Escape y devuelve el foco al botón', () => {
    renderMenu();

    abrir();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acciones de la venta #10' })).toHaveFocus();
  });

  it('navega las opciones con las flechas del teclado', () => {
    renderMenu();

    abrir();
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Eliminar' })).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
  });

  it('cierra al hacer click afuera', () => {
    renderMenu();

    abrir();
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
