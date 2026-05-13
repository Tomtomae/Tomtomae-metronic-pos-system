export interface Customer {
    _id: string;
    name: string;
    email?: string;
    contact?: {
        name: string;
        phone: string;
    };
    address?: {
        district: string;
        province: string;
        postCode?: string;
    };
}

export interface Item {
    _id: string;
    ItemCode: string;
    Iname: string;
    description?: string;
    dis?: string;
    type: 'Product' | 'Service';
    unit: 'Item' | 'Hour' | 'Day' | 'Month' | 'Year' | string;
    price: number;
    taxRate: number;
}

export interface LineItem {
    item?: string | Item;
    name: string;
    description?: string;
    type: 'Product' | 'Service';
    quantity: number;
    unit: 'Item' | 'Hour' | 'Day' | 'Month' | 'Year' | string;
    price: number;
    taxRate: number;
    amount: number;
    taxAmount: number;
    total: number;
}

export type InvoiceStatus = 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';

export interface InvoiceModel {
    _id?: string;
    invoiceNumber: string;
    quotationRef?: string;
    customer: string | Customer;
    description?: string;
    lineItems: LineItem[];
    currency: string;
    exchangeRate: number;
    subtotal: number;
    totalTax: number;
    discount: number;
    grandTotal: number;
    totalPaid: number;
    balanceDue: number;
    issueDate: string | Date;
    dueDate: string | Date;
    status: InvoiceStatus;
    notes?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    createdBy?: string | { _id?: string; first_name?: string; last_name?: string; email?: string };
}

export const isCustomerPopulatedInInvoice = (
    customer: string | Customer | null | undefined
): customer is Customer => {
    return (
        customer !== null &&
        customer !== undefined &&
        typeof customer === 'object' &&
        'name' in customer
    );
};