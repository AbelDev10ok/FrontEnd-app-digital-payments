import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductPicker from '../ProductPicker';
import type { ProductDto, ProductTypeDto } from '@/shared/types/sales';
import { formatCurrency } from '@/shared/utils/formatCurrency';

/**
 * Texto tal como queda en el DOM: Intl separa el símbolo del número con un
 * espacio fino (U+00A0) y la búsqueda por texto no lo normaliza sola.
 */
const textoEnPantalla = (monto: number, moneda: string) =>
  formatCurrency(monto, moneda).replace(/\u00a0/g, ' ');

const productTypes: ProductTypeDto[] = [
  { id: 1, name: 'TV' },
  { id: 2, name: 'Heladera' },
];

const products: ProductDto[] = [
  { id: 1, variantId: 11, name: 'TV LG 55', sku: 'TV-LG-55', cost: 700, price: 900, stock: 10, productTypeId: 1, productTypeName: 'TV' },
  { id: 2, variantId: 12, name: 'Heladera Samsung', variantLabel: 'Inox', cost: 1200, price: 1500, stock: 3, productTypeId: 2, productTypeName: 'Heladera' },
  { id: 3, variantId: 13, name: 'TV Philips 32', cost: 300, price: 450, productTypeId: 1, productTypeName: 'TV' },
  { id: 4, variantId: 14, name: 'Cable HDMI', cost: 50, price: null, stock: 20, productTypeId: 1, productTypeName: 'TV' },
  { id: 5, variantId: 15, name: 'Parlante', cost: 200, price: 300, stock: 0, productTypeId: 1, productTypeName: 'TV' },
  { id: 6, variantId: 16, name: 'Televisor viejo', cost: 100, price: 200, stock: 4, productTypeId: 1, productTypeName: 'TV', active: false },
];

describe('ProductPicker', () => {
  it('muestra todos los productos en la grilla', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    expect(screen.getByText('TV LG 55')).toBeInTheDocument();
    expect(screen.getByText('Heladera Samsung')).toBeInTheDocument();
    expect(screen.getByText(/TV Philips 32/)).toBeInTheDocument();
  });

  it('muestra la etiqueta de la variante y su SKU', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    expect(screen.getByText('Inox')).toBeInTheDocument();
    expect(screen.getByText('TV-LG-55')).toBeInTheDocument();
  });

  it('muestra los atributos de la variante y los incluye en la búsqueda', () => {
    const conAtributos: ProductDto[] = [
      {
        id: 7,
        variantId: 70,
        name: 'Samsung A16',
        sku: 'A16-4-ROJO',
        cost: 100,
        price: 150,
        stock: 5,
        productTypeId: 1,
        productTypeName: 'TV',
        attributes: [
          { attributeId: 1, attributeName: 'Color', attributeValueId: 10, value: 'Rojo' },
          { attributeId: 2, attributeName: 'RAM', attributeValueId: 20, value: '4 GB' },
        ],
      },
    ];
    render(<ProductPicker products={conAtributos} productTypes={productTypes} onSelect={vi.fn()} />);

    expect(screen.getByText('Color: Rojo · RAM: 4 GB')).toBeInTheDocument();

    // Se puede buscar por valor ("rojo") y por nombre de atributo ("ram")
    const input = screen.getByPlaceholderText('Buscar producto…');
    fireEvent.input(input, { target: { value: 'rojo' } });
    expect(screen.getByText('Samsung A16')).toBeInTheDocument();

    fireEvent.input(input, { target: { value: 'ram' } });
    expect(screen.getByText('Samsung A16')).toBeInTheDocument();

    // Al elegirlo, la barra inferior repite los atributos (tarjeta + barra)
    fireEvent.click(screen.getByText('Samsung A16'));
    expect(screen.getAllByText('Color: Rojo · RAM: 4 GB')).toHaveLength(2);
  });

  it('muestra el badge de costo y ganancia de cada variante', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);

    // TV LG 55: costo 700, precio 900 → ganancia 200
    expect(screen.getByText(`Costo ${textoEnPantalla(700, 'ARS')}`)).toBeInTheDocument();
    expect(screen.getByText(`Ganancia ${textoEnPantalla(200, 'ARS')}`)).toBeInTheDocument();
    // Cable HDMI no tiene precio: sólo se muestra el costo
    expect(screen.getByText(`Costo ${textoEnPantalla(50, 'ARS')}`)).toBeInTheDocument();
    expect(screen.queryByText(`Ganancia ${textoEnPantalla(-50, 'ARS')}`)).not.toBeInTheDocument();
  });

  it('el badge multiplica el costo y la ganancia por la cantidad elegida', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('TV LG 55'));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));

    // 2 unidades: costo 1400, ganancia 400 (en la tarjeta y en la barra inferior)
    expect(screen.getAllByText(`Costo ${textoEnPantalla(1400, 'ARS')}`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`Ganancia ${textoEnPantalla(400, 'ARS')}`).length).toBeGreaterThan(0);
  });

  it('filtra por categoría al tocar un chip', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('TV'));
    expect(screen.getByText('TV LG 55')).toBeInTheDocument();
    expect(screen.queryByText('Heladera Samsung')).not.toBeInTheDocument();
  });

  it('despliega subcategorías al tocar el padre y filtra por toda su jerarquía', () => {
    const hierarchicalCategories: ProductTypeDto[] = [
      { id: 10, name: 'Electrónica' },
      { id: 11, name: 'Televisores', parentId: 10 },
      { id: 12, name: 'Accesorios', parentId: 10 },
      { id: 13, name: 'Audio' },
    ];
    const categorizedProducts: ProductDto[] = [
      { ...products[0], productTypeId: 10, name: 'Producto general' },
      { ...products[1], productTypeId: 11, name: 'Televisor' },
      { ...products[2], productTypeId: 12, name: 'Cable' },
      { ...products[3], productTypeId: 13, name: 'Parlante' },
    ];
    render(
      <ProductPicker
        products={categorizedProducts}
        productTypes={hierarchicalCategories}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Televisores' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Electrónica/ }));

    expect(screen.getByRole('button', { name: 'Televisores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accesorios' })).toBeInTheDocument();
    expect(screen.getByText('Producto general')).toBeInTheDocument();
    expect(screen.getByText('Televisor')).toBeInTheDocument();
    expect(screen.getByText('Cable')).toBeInTheDocument();
    expect(screen.queryByText('Parlante')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Televisores' }));
    expect(screen.getByText('Televisor')).toBeInTheDocument();
    expect(screen.queryByText('Cable')).not.toBeInTheDocument();
  });

  it('busca productos por nombre, etiqueta o SKU', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Buscar producto…');
    fireEvent.input(input, { target: { value: 'heladera' } });
    expect(screen.getByText('Heladera Samsung')).toBeInTheDocument();
    expect(screen.queryByText('TV LG 55')).not.toBeInTheDocument();

    fireEvent.input(input, { target: { value: 'tv-lg-55' } });
    expect(screen.getByText('TV LG 55')).toBeInTheDocument();
  });

  it('deshabilita productos sin precio', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    const sinPrecio = screen.getByText('Cable HDMI');
    const button = sinPrecio.closest('button');
    expect(button).toBeDisabled();
  });

  it('marca sin stock y deshabilita la variante agotada', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);

    expect(screen.getByText('Sin stock')).toBeInTheDocument();
    expect(screen.getByText('Parlante').closest('button')).toBeDisabled();
    expect(screen.getByText('Stock: 0')).toBeInTheDocument();
  });

  it('marca inactivo y deshabilita la variante desactivada', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);

    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByText('Televisor viejo').closest('button')).toBeDisabled();
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

  it('no deja pedir más unidades que el stock disponible', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('Heladera Samsung')); // stock 3
    const aumentar = screen.getByRole('button', { name: 'Aumentar cantidad' });
    fireEvent.click(aumentar);
    fireEvent.click(aumentar);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    fireEvent.click(aumentar);
    // Sigue en 3: no se puede superar el stock
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('da nombre accesible al campo de cantidad del stepper', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('TV LG 55'));

    expect(screen.getByLabelText('Cantidad')).toHaveValue(1);
  });

  it('aumenta la cantidad con el botón del stepper', () => {
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('TV LG 55'));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('llama a onSelect con la variante y cantidad al tocar Continuar', () => {
    const onSelect = vi.fn();
    render(<ProductPicker products={products} productTypes={productTypes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('TV LG 55'));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, variantId: 11, name: 'TV LG 55' }),
      1,
    );
  });

  it('abre con la variante y la cantidad marcadas al volver con "Cambiar"', () => {
    const onSelect = vi.fn();
    render(
      <ProductPicker
        products={products}
        productTypes={productTypes}
        onSelect={onSelect}
        initialVariantId={12}
        initialCantidad={2}
      />,
    );

    // La barra inferior arranca con Heladera (1500 × 2 = 3000)
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByText(textoEnPantalla(3000, 'ARS'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 12, name: 'Heladera Samsung' }),
      2,
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
