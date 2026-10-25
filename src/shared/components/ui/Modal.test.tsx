import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  it('no renderiza nada si isOpen es false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Título">
        Contenido
      </Modal>,
    );
    expect(screen.queryByText('Título')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });

  it('muestra título y children si isOpen es true', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Título">
        Contenido
      </Modal>,
    );
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('el botón de cerrar dispara onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Título">
        Contenido
      </Modal>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clic en el fondo cierra el modal; clic en el contenido no', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose} title="Título">
        Contenido
      </Modal>,
    );

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    fireEvent.click(screen.getByText('Contenido'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Esc cierra el diálogo mientras está abierto', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Título">
        Contenido
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no escucha Esc cuando está cerrado', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={false} onClose={onClose} title="Título">
        Contenido
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('entra con animación y la desactiva con prefers-reduced-motion', () => {
    const { container } = render(
      <Modal isOpen onClose={vi.fn()} title="Título">
        Contenido
      </Modal>,
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass('animate-modal-overlay', 'motion-reduce:animate-none');
    expect(overlay.querySelector('.animate-modal-panel')).toHaveClass('motion-reduce:animate-none');
  });
});
