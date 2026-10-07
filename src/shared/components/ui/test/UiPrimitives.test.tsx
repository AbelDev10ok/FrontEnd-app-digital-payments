import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import Field from '../Field';
import Alert from '../Alert';
import Badge from '../Badge';
import PageHeader from '../PageHeader';
import Load from '../../feedback/Load';
import ErrorMessage from '../../feedback/ErrorMessage';

describe('Button', () => {
  it('aplica la variante y el tamaño por defecto', () => {
    render(<Button>Aceptar</Button>);
    const btn = screen.getByRole('button', { name: 'Aceptar' });
    expect(btn.className).toContain('bg-brand-600');
    expect(btn.className).toContain('px-4 py-2.5');
    expect(btn).not.toBeDisabled();
  });

  it('se deshabilita mientras isLoading', () => {
    render(<Button isLoading>Guardando</Button>);
    expect(screen.getByRole('button', { name: 'Guardando' })).toBeDisabled();
  });

  it('respeta la prop disabled', () => {
    render(<Button disabled>No disponible</Button>);
    expect(screen.getByRole('button', { name: 'No disponible' })).toBeDisabled();
  });

  it('llama onClick al hacer click', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Ok</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Input', () => {
  it('no agrega la clase inválida por defecto', () => {
    render(<Input placeholder="Nombre" />);
    expect(screen.getByPlaceholderText('Nombre').className).not.toContain('border-red-500');
  });

  it('agrega la clase inválida cuando invalid', () => {
    render(<Input placeholder="Nombre" invalid />);
    expect(screen.getByPlaceholderText('Nombre').className).toContain('border-red-500');
  });
});

describe('Select', () => {
  it('agrega la clase inválida cuando invalid', () => {
    render(
      <Select aria-label="estado" invalid>
        <option>Opción</option>
      </Select>,
    );
    expect(screen.getByLabelText('estado').className).toContain('border-red-500');
  });

  it('renderiza sus opciones', () => {
    render(
      <Select aria-label="estado">
        <option>A</option>
        <option>B</option>
      </Select>,
    );
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
});

describe('Field', () => {
  it('muestra el label y el error', () => {
    render(
      <Field label="Nombre" error="Requerido">
        <input />
      </Field>,
    );
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Requerido')).toBeInTheDocument();
  });

  it('muestra el hint y el asterisco de requerido cuando no hay error', () => {
    render(
      <Field label="Nombre" hint="Ayuda" required>
        <input />
      </Field>,
    );
    expect(screen.getByText('Ayuda')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});

describe('Alert', () => {
  it('muestra el título y los children', () => {
    render(<Alert title="Aviso">Contenido</Alert>);
    expect(screen.getByText('Aviso')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('aplica el wrapper del tone danger', () => {
    const { container } = render(<Alert tone="danger">Error</Alert>);
    expect(container.firstChild).toHaveClass('bg-red-50');
  });
});

describe('Badge', () => {
  it('aplica el tone y muestra el contenido', () => {
    render(<Badge tone="success">Activo</Badge>);
    const badge = screen.getByText('Activo');
    expect(badge.className).toContain('bg-emerald-50');
  });

  it('usa el tone neutral por defecto', () => {
    render(<Badge>Genérico</Badge>);
    expect(screen.getByText('Genérico').className).toContain('bg-gray-100');
  });
});

describe('PageHeader', () => {
  it('renderiza título, subtítulo y acciones', () => {
    render(
      <PageHeader
        title="Clientes"
        subtitle="Lista de clientes"
        actions={<button>Nuevo</button>}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByText('Lista de clientes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();
  });
});

describe('Load', () => {
  it('muestra el mensaje por defecto', () => {
    render(<Load />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('muestra el mensaje personalizado', () => {
    render(<Load message="Obteniendo datos" />);
    expect(screen.getByText('Obteniendo datos')).toBeInTheDocument();
  });
});

describe('ErrorMessage', () => {
  it('muestra el mensaje de error', () => {
    render(<ErrorMessage message="Algo salió mal" />);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });
});
