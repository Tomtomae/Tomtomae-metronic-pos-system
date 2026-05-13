import mongoose, { Schema, Document, Model } from 'mongoose';
export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
export interface IUser {
  username: string;
  password?: string;
  email: string;
  first_name: string;
  last_name: string;
  pic: string;
  role: RoleType;
  companyName: string;
  taxId: string;
  phone: string;
  website: string;
  country: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    postCode: string;
  };
  currency: 'LAK' | 'THB' | 'USD';
  language: 'en' | 'lo' | 'th';
  settings: {
    emailNotification: boolean;
    sendCopyToPersonalEmail: boolean;
  };
  isDeleted: boolean; // ເພີ່ມ Field ນີ້
}


interface IUserVirtuals {
  fullname: string;
  picUrl: string;
  isAdmin: boolean;
  isEmployee: boolean;
}
export type UserDocument = Document & IUser & IUserVirtuals;

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  pic: { type: String, default: 'media/avatars/blank.png' },
  role: { 
    type: String, 
    enum: Object.values(ROLES), 
    default: ROLES.EMPLOYEE, 
    required: true 
  },
  companyName: { type: String, default: '' },
  taxId: { type: String, default: '' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },
  country: { type: String, default: 'LA' },
  address: {
    addressLine: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postCode: { type: String, default: '' }
  },
  currency: { type: String, enum: ['LAK', 'THB', 'USD'], default: 'LAK' },
  language: { type: String, enum: ['en', 'lo', 'th'], default: 'lo' },
  settings: {
    emailNotification: { type: Boolean, default: true },
    sendCopyToPersonalEmail: { type: Boolean, default: false }
  },
  isDeleted: { type: Boolean, default: false } // ເພີ່ມລົງໃນ Schema
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('fullname').get(function(this: UserDocument) {
  return `${this.first_name} ${this.last_name}`.trim();
});

userSchema.virtual('picUrl').get(function(this: UserDocument) {
  if (this.pic) {
    if (this.pic.startsWith('http')) return this.pic;
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    return `${baseUrl}/${this.pic.replace(/^\//, '')}`;
  }
  return `http://localhost:5000/media/avatars/blank.png`;
});

userSchema.virtual('isAdmin').get(function(this: UserDocument) {
  return this.role === ROLES.ADMIN;
});

userSchema.virtual('isEmployee').get(function(this: UserDocument) {
  return this.role === ROLES.EMPLOYEE;
});

export const User = mongoose.model<IUser, Model<IUser, {}, IUserVirtuals>>('User', userSchema);