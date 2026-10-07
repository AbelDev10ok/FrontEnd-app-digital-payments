import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductPicker from '../ProductPicker';
import type { ProductDto, ProductTypeDto } from '@/shared/types/sales';

const productTypes: ProductTypeDto[] = [
  { id: 1, name: 'TV' },
  { id: 2, name: 'Heladera' },
];

const products: ProductDto[] = [
  { id: 1, name: 'TV LG 55', price: 900, stock: 10, productTypeId: 1, productTypeName: 'TV' },
  { id: 2, name: 'Heladera Samsung', price: 1500, stock: 3, productTypeId: 2, productTypeName: 'Heladera' },
  { id: 3, name: 'TV Philips 32', price: 450, productTypeId: 1, productTypeName: 'TV' },
  { id: 4, name: 'Cable HDMI', price: null, stock: 20, productTypeId: 1, productTypeName: 'TV' },
];

describe('ProductPicker', () => {
  it('muestra todos los productos en la grilla', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    expect(screen.getByText('TV LG 55')).toBeInTheDocument();
    expect(screen.getByText('Heladera Samsung')).toBeInTheDocument();
    expect(screen.getByText('TV Philips 32')).toBeInTheDocument();
  });

  it('filtra por categoría al tocar un chip', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('TV'));
    expect(screen.getByText('TV LG 55')).toBeInTheDocument();
    expect(screen.getByText('TV Philips 32')).toBeInTheDocument();
    expect(screen.queryByText('Heladera Samsung')).not.toBeInTheDocument();
  });

  it('busca productos por nombre', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Buscar producto…');
    fireEvent.input(input, { target: { value: 'heladera' } });
    expect(screen.getByText('Heladera Samsung')).toBeInTheDocument();
    expect(screen.queryByText('TV LG 55')).not.toBeInTheDocument();
  });

  it('deshabilita productos sin precio', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    const sinPrecio = screen.getByText('Cable HDMI');
    const button = sinPrecio.closest('button');
    expect(button).toBeDisabled();
  });

  it('muestra stock registrado de forma discreta, sin alertas de agotado', () => {
    const productsWithEmptyStock = [
      { id: 5, name: 'Parlante', price: 300, stock: 0, productTypeId: 1, productTypeName: 'TV' },
    ];
    render(<ProductPicker products={productsWithEmptyStock} productTypes={productTypes} onSelect={vi.fn()} />);

    expect(screen.getByText('Stock: 0')).toHaveClass('text-gray-400');
    expect(screen.queryByText('Sin stock')).not.toBeInTheDocument();
  });

  it('selecciona un producto y muestra la barra inferior con el stepper', () => {
    const onSelect = vi.fn();
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('TV LG 55'));
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText(/por unidad/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });

  it('el stepper de cantidad modifica el total en vivo', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('TV LG 55'));
    const input = screen.getByDisplayValue('1') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    fireEvent.input(input, { target: { value: '3' } });
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('aumenta la cantidad con el botón del stepper', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('TV LG 55'));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('llama a onSelect con producto y cantidad al tocar Continuar', () => {
    const onSelect = vi.fn();
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('TV LG 55'));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'TV LG 55' }),
      1,
    );
  });

  it('muestra el mensaje de vacío cuando no hay productos', () => {
    render(<ProductPicker products={[]} productTypes={productTypes} onSelect={vi.fn()} />);
    expect(screen.getByText('No hay productos registrados')).toBeInTheDocument();
    expect(screen.getByText('Ir al catálogo')).toBeInTheDocument();
  });

  it('muestra mensaje cuando los filtros no encuentran productos', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Buscar producto…');
    fireEvent.input(input, { target: { value: 'xyz' } });
    expect(screen.getByText('No se encontraron productos con esos filtros.')).toBeInTheDocument();
  });
});
