// import { useState, useMemo } from 'react';

// interface OverdueFee {
//   id: number;
//   saleId: number;
//   numberFee: number;
//   amount: number;
//   expirationDate: string;
//   paid: boolean;
//   clientName: string;
//   saleDescription: string;
//   productDescription: string;
//   productTypeId: number;
// }

// export const useFeesFilters = (fees: OverdueFee[]) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedProductType, setSelectedProductType] = useState('');

//   const filteredFees = useMemo(() => {
//     return fees.filter(fee => {
//       const searchMatch =
//         fee.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         fee.saleDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         fee.id.toString().includes(searchTerm);

//       const productTypeMatch =
//         !selectedProductType ||
//         fee.productTypeId.toString() === selectedProductType;

//       return searchMatch && productTypeMatch;
//     });
//   }, [fees, searchTerm, selectedProductType]);

//   return {
//     searchTerm,
//     setSearchTerm,
//     selectedProductType,
//     setSelectedProductType,
//     filteredFees
//   };
// };
