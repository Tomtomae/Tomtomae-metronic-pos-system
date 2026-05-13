export interface AuthModel {
  api_token: string
  refreshToken?: string
}

export interface UserAddressModel {
  addressLine?: string
  city?: string
  state?: string
  postCode?: string
}

export interface UserSettingsModel {
  emailNotification?: boolean
  sendCopyToPersonalEmail?: boolean
}

export interface UserSocialNetworksModel {
  facebook?: string
  whatsApp?: string
  lineId?: string
}

export interface UserModel {

  _id?: string
  id?: string 

  username: string
  password?: string 
  email: string
  first_name: string
  last_name: string
  fullname?: string 

  companyName?: string
  taxId?: string
  phone?: string
  website?: string
  country?: string

  currency?: 'LAK' | 'THB' | 'USD'
  language?: 'en' | 'lo' | 'th'
  timeZone?: string

  role?: string

  pic?: string
  picUrl?: string
  

  settings?: UserSettingsModel
  address?: UserAddressModel
  socialNetworks?: UserSocialNetworksModel

  auth?: AuthModel
}

export interface LoginModel { 
  email: string
  password: string
}

// --- ส่วนของ Dashboard Models (ตรงตามที่ใช้งานใน Metronic) ---

export interface TrendsModel {
  _id?: string
  title: string
  subtitle?: string
  valueChange: string
  category: 'author' | 'user' | 'theme' | 'app'
}

export interface FinancialStateModel {
  revenue: number
  expenses: number
  commissions: number
  averageSale: number
  netProfit: number
}

export interface CompetitorModel {
  _id?: string
  name: string
  description: string
  author: string
  sales: number
  logo: string
}