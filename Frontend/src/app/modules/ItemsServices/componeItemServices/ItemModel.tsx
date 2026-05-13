export interface ItemModel {
  _id?: string;
  ItemCode: string;
  Iname: string;
  description?: string;
  category?: string;   
  
  type: 'Product' | 'Service'; 
  unit: 'Item' | 'Hour' | 'Day' | 'Month' | 'Year' | string;
  
  currency?: 'LAK' | 'USD' | 'THB' | string;
  costPrice?: number;   
  price: number;
  taxRate: number;

  status?: 'Active' | 'Inactive' | string; 
  
  createdAt?: string;
  updatedAt?: string;
}

export const unitTranslations: Record<string, string> = {
  Item: 'ເຄື່ອງ',
  Hour: 'ຊົ່ວໂມງ',
  Day: 'ວັນ',
  Month: 'ເດືອນ',
  Year: 'ປີ',
};

export const typeTranslations: Record<string, string> = {
  Product: 'ສິນຄ້າ',
  Service: 'ບໍລິການ',
};

export const statusTranslations: Record<string, string> = {
  Active: 'ເປີດໃຊ້ງານ',
  Inactive: 'ປິດໃຊ້ງານ (ລຶບແລ້ວ)',
};