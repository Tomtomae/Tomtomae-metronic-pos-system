import e from 'express';
import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  occupation: { type: String, default: '' },
  companyName: { type: String, default: '' },
  companyNameSite:{type:String ,default:''},
  phone: { type: String, default: '' },
  country: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  pic: { type: String, default: 'default.jpg' },
  roles: { type: [Number], default: [1] },// 1 อาจจะหมายถึง User ทั่วไป
  language: { 
    type: String, 
    enum: ['en', 'de', 'es', 'fr', 'ja', 'zh', 'ru', 'th'], 
    default: 'en'
  },
  timeZone: { type: String, default: 'UTC' },
  website:{type:String , default:"https://keenthemes.com"},
  // เก็บข้อมูลการตั้งค่าแบบ Nested ตาม Interface
  address: {
    addressLine: {type: String, default: ''},
    city: {type: String, default: ''},
    state: {type: String, default: ''},
    postCode: {type: String, default: ''}
  },
  socialNetworks: {
    linkedIn: {type: String, default: ''},
    facebook: {type: String, default: ''},
    twitter: {type: String, default: ''},
    instagram: {type: String, default: ''}
  },
  emailSettings:{
    emailNotification: {type: Boolean, default: false},
    sendCopyToPersonalEmail: {type: Boolean, default: false}, 
    activityRelatesEmail: { type: Object, default: {} }, // ใช้ Object เพื่อรองรับค่า Nested
    updatesFromKeenthemes: { type: Object, default: {} }
  },
  communications: {
    email: {type: Boolean, default: false},
    phone: {type: Boolean, default: false},
  },
  allowMarketing: {type: Boolean, default: false},  
}, { 
  timestamps: true,
  toJSON: { virtuals: true, }, // เพื่อให้สร้าง fullname แบบอัตโนมัติได้
  toObject: { virtuals: true }
});

// สร้าง Virtual Field สำหรับ fullname (ไม่ต้องเก็บใน DB แต่คำนวณให้ตอนดึงข้อมูล)
userSchema.virtual('fullname').get(function() {
  return `${this.first_name} ${this.last_name}`;
});
const UserSocialNetworksModel = new Schema({
  linkedIn: {type: String, default: ''},
  facebook: {type: String, default: ''},
  twitter: {type: String, default: ''},
  instagram: {type: String, default: ''}
});
export const User = mongoose.model('User', userSchema);