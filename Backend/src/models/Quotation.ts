import mongoose, { Schema } from 'mongoose';

const QuotationSchema = new Schema({
    quotationId: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        index: true 
    },
    customer: { 
        type: Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    description: { type: String, trim: true },
    status: { 
        type: String, 
        enum: ['Draft', 'Sent', 'Approved', 'Declined', 'Invoiced', 'Rejected', 'Expired'],     
        default: 'Draft' 
    },
    isDeleted: { type: Boolean, default: false },
    validUntil: { 
        type: Date, 
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
    },
    currency: {
        type: String,
        enum: ['LAK', 'USD', 'THB'],
        default: 'LAK',
        required: true
    },
    exchangeRate: {
        type: Number,
        default: 1,
        min: 0
    },
    lineItems: [{
        item: { type: Schema.Types.ObjectId, ref: 'Item' },
        name: { type: String, required: true },
        description: String,
        type: { 
            type: String, 
            enum: ['Product', 'Service'], 
            required: true 
        },
        unit: { 
            type: String, 
            required: true 
        },
        quantity: { type: Number, required: true, default: 1, min: 1 },
        price: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, required: true, default: 0 },
        amount: { type: Number, required: true, default: 0 },
        taxAmount: { type: Number, default: 0 },
        total: { type: Number, required: true, default: 0 }
    }],
    subtotal: { type: Number, default: 0, required: true },
    totalTax: { type: Number, default: 0, required: true }, 
    grandTotal: { type: Number, default: 0, required: true },
    notes: { type: String },
    termsConditions: { type: String },
    // ✅ ບັງຄັບບັນທຶກວ່າໃຜເປັນຄົນສ້າງ
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
    timestamps: true 
});

export const QuotationModel = mongoose.model('Quotation', QuotationSchema);