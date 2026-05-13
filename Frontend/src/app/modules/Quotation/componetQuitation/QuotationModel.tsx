export interface Customer {
    _id: string;
    customerCode: string;
    name: string;
    contact: {
        name: string;
        phone: string;
    };
    email: string;
    address: {
        village: string;
        district: string;
        province: string;
        postCode: string;
    };
    taxId?: string;
    status: 'Active' | 'Inactive';
}

export interface Item {
    _id: string;
    ItemCode: string;
    Iname: string;
    description?: string;
    type: 'Product' | 'Service';
    unit: string;
    price: number;
    taxRate: number;
    status: 'Active' | 'Inactive';
}

export interface LineItem {
    _id?: string; 
    item: string; 
    name: string;
    description?: string;
    type: 'Product' | 'Service';
    unit: string;
    quantity: number;
    price: number;
    taxRate: number;
    amount: number;    
    taxAmount: number;   
    total: number;       
}

export interface QuotationModel {
    _id?: string;
    quotationId: string;
    customer: string | Customer; 
    status: 'Draft' | 'Sent' | 'Approved' | 'Declined' | 'Invoiced' | 'Rejected' | 'Expired';
    currency: 'LAK' | 'USD' | 'THB';
    exchangeRate: number;
    description?: string;
    lineItems: LineItem[];
    issueDate: Date | string;
    validUntil: Date | string;
    subtotal: number;
    totalTax: number; 
    grandTotal: number;
    notes?: string;
    termsConditions?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminOptions{
    _id:string;
    first_name:string;
    last_name:string;
}