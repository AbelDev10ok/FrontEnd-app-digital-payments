import React from 'react';
import { Tv, Watch, Sofa, Smartphone, CreditCard } from 'lucide-react';

interface Props {
  category?: string | null;
}

const ProductCategoryIcon: React.FC<Props> = ({ category }) => {
  return (
    <div className="mt-2 min-h-[28px]">
      {category === 'TV' && <Tv className="inline w-6 h-6 text-indigo-500" />}
      {category === 'RELOJ' && <Watch className="inline w-6 h-6 text-indigo-500" />}
      {category === 'MUEBLERIA' && <Sofa className="inline w-6 h-6 text-indigo-500" />}
      {category === 'CELULAR' && <Smartphone className="inline w-6 h-6 text-indigo-500" />}
      {category === 'OTRO' && <CreditCard className="inline w-6 h-6 text-indigo-500" />}
    </div>
  );
};

export default ProductCategoryIcon;
