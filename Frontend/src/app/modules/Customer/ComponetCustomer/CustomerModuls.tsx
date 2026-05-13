export interface Address {
    village: string;
    district: string;
    province: string;
    postCode: string;
}

export interface Contact {
    name: string;
    phone: string;
}

export interface customer {
    _id?: string;
    customerNo?: string;
    name: string;
    website?: string;
    avatar?: string;
    email: string;
    paymentNo?: string;
    contact: Contact;
    address: Address;
    taxId?: string;
    paymentTerms: 'net30' | 'net45' | 'net60' | 'net90';
    totalOrdersAmount: number;
}

export interface Payment {
    _id: string;
    paymentNumber: string;

    invoice: {
        _id: string;
        invoiceNumber: string;
    } | string;

    customer: string | customer;

    amount: number;
    currency: string;

    invoiceTotalSnapshot?: number;
    totalAmount?: number;

    method: 'Cash' | 'Transfer';
    reference?: string;
    notes?: string;
    paymentDate: string | Date;
}

export type CreateCustomerInput = Omit<customer, '_id' | 'totalOrdersAmount'>;