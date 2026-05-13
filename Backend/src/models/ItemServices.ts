import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
    ItemCode: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        index: true 
    },
    Iname: { 
        type: String, 
        required: true, 
        trim: true 
    }, 
    description: { 
        type: String, 
        trim: true,
        default: '' 
    }, 
    category: {
        type: String,
        trim: true,
        default: 'General'
    }, 
    type: { 
        type: String, 
        required: true,     
        enum: ['Product', 'Service'], 
        default: 'Product'
    },
    unit: { 
        type: String, 
        required: true, 
        enum: ['Item', 'Hour', 'Day', 'Month', 'Year'],
        default: 'Item' 
    },
    currency: {
        type: String,
        required: true,
        enum: ['LAK', 'USD', 'THB'],    
        default: 'LAK'
    },
    costPrice: { 
        type: Number, 
        min: 0,
        default: 0
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    taxRate: { 
        type: Number, 
        required: true, 
        default: 0, 
        min: 0,
        max: 100 
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    customer: { 
        type: Schema.Types.ObjectId, 
        ref: 'Customer',
        required: false 
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
    timestamps: true 
});

export const ItemModel = mongoose.model("Item", itemSchema);