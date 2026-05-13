export interface Customer {
    _id: string;
    name: string; 
    email?: string;
    phoneNumber?: string; 
    contact?: {
        name: string; 
        phone: string; 
    };
    address?: {
        district: string;
        province: string;
    };
}

export interface LineItem {
    name: string;
    description?: string;
    type?: string;
    price: number;
    quantity: number;
    taxRate?: number;
    amount: number;
    total?: number; 
}

export interface InvoiceReference {
    _id: string;
    invoiceNumber: string;
    grandTotal: number;
    totalPaid: number;  
    balanceDue: number; 
    status: 'Pending' | 'Partial' | 'Paid' | 'Cancelled';
    currency: 'LAK' | 'USD' | 'THB' | string;
    lineItems?: LineItem[]; 
}

export interface PaymentModule {
    _id?: string;
    paymentNumber: string;    
    invoice: string | InvoiceReference;
    customer: string | Customer;     
    currency: 'LAK' | 'USD' | 'THB' | string;  
    exchangeRate: number;
    amount: number;           
    invoiceTotalSnapshot?: number; 
    method: 'Cash' | 'Transfer';
    
    reference?: string;       
    notes?: string;           
    paymentDate: string | Date; 
    status: 'Completed' | 'Cancelled';
    
    createdAt?: string;
    updatedAt?: string;
}

// Type Guard สำหรับ Invoice
export const isInvoicePopulated = (invoice: string | InvoiceReference): invoice is InvoiceReference => {
    return (invoice as InvoiceReference).invoiceNumber !== undefined;
};

// ✨ เพิ่ม Type Guard สำหรับ Customer ด้วย จะได้เขียนโค้ดง่ายขึ้น ✨
export const isCustomerPopulated = (customer: string | Customer): customer is Customer => {
    return (customer as Customer).name !== undefined;
};