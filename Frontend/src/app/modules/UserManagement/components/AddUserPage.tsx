import React, { useState } from 'react'
import axios from 'axios'
import { KTIcon } from '../../../../_metronic/helpers'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const API_URL: string = import.meta.env.VITE_APP_API_URL

type ModalTab = 'account' | 'business' | 'locale'

export interface FormState {
    first_name:  string
    last_name:   string
    email:       string
    username:    string
    password:    string
    role:        'admin' | 'employee'
    companyName: string
    taxId:       string
    phone:       string
    website:     string
    country:     string
    address: { addressLine: string; city: string; state: string; postCode: string }
    currency:    'LAK' | 'THB' | 'USD'
    language:    'en' | 'lo' | 'th'
    settings: { emailNotification: boolean; sendCopyToPersonalEmail: boolean }
}

const emptyForm = (): FormState => ({
    first_name: '', last_name: '', email: '', username: '', password: '',
    role: 'employee', companyName: '', taxId: '', phone: '', website: '', country: 'LA',
    address: { addressLine: '', city: '', state: '', postCode: '' },
    currency: 'LAK', language: 'lo',
    settings: { emailNotification: true, sendCopyToPersonalEmail: false },
})

interface AddUserModalProps {
    show: boolean
    onClose: () => void
    onSuccess: () => void
}

const AddUserModal: React.FC<AddUserModalProps> = ({ show, onClose, onSuccess }) => {
    const [tab, setTab] = useState<ModalTab>('account')
    const [form, setForm] = useState<FormState>(emptyForm())
    const [loading, setLoading] = useState<boolean>(false)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

    if (!show) return null

    const set = (field: keyof FormState, value: unknown) => setForm(prev => ({ ...prev, [field]: value }))

    const validate = (): boolean => {
        const e: Partial<Record<keyof FormState, string>> = {}
        if (!form.first_name.trim()) e.first_name = 'ກະລຸນາປ້ອນຊື່'
        if (!form.last_name.trim())  e.last_name  = 'ກະລຸນາປ້ອນນາມສະກຸນ'
        if (!form.email.trim())      e.email      = 'ກະລຸນາປ້ອນອີເມວ'
        if (!form.username.trim())   e.username   = 'ກະລຸນາປ້ອນ Username'
        if (!form.password)          e.password   = 'ກະລຸນາປ້ອນລະຫັດຜ່ານ'
        
        setErrors(e)
        if (Object.keys(e).length > 0) { setTab('account'); return false }
        return true
    }

    const handleSubmit = async () => {
        if (!validate()) return
        try {
            setLoading(true)
            await axios.post(`${API_URL}/users`, form)
            
            MySwal.fire({
                icon: 'success',
                title: 'ສຳເລັດ!',
                text: 'ສ້າງຜູ້ໃຊ້ໃໝ່ຮຽບຮ້ອຍແລ້ວ',
                showConfirmButton: false,
                timer: 2000,
                customClass: { popup: 'rounded-4' }
            })
            
            setForm(emptyForm())
            onSuccess()
            onClose()
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                MySwal.fire({
                    icon: 'error',
                    title: 'ເກີດຂໍ້ຜິດພາດ!',
                    text: err.response?.data?.message || 'ບໍ່ສາມາດສ້າງຜູ້ໃຊ້ໄດ້',
                    confirmButtonText: 'ຕົກລົງ',
                    customClass: { confirmButton: 'btn btn-primary rounded-3', popup: 'rounded-4' }
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const inputClass = (field?: keyof FormState) => `form-control form-control-solid ${field && errors[field] ? 'border-danger' : ''}`

    const TABS: { key: ModalTab; label: string; icon: string }[] = [
        { key: 'account',  label: 'ບັນຊີ & ສິດ',          icon: 'profile-user' },
        { key: 'business', label: 'ທຸລະກິດ & ທີ່ຢູ່',      icon: 'office-bag'   },
        { key: 'locale',   label: 'ພາສາ & ການແຈ້ງເຕືອນ',  icon: 'globe'        },
    ]

    return (
        <div className='modal fade show d-flex align-items-center justify-content-center' style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1055, padding: '1rem' }}>
            <div className='modal-dialog modal-dialog-centered mw-650px w-100'>
                <div className='modal-content shadow-lg border-0' style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className='modal-header border-0 p-7' style={{ background: 'linear-gradient(135deg, #009ef7, #0081d8)' }}>
                        <div className='d-flex align-items-center gap-4'>
                            <div className='w-40px h-40px rounded-3 d-flex align-items-center justify-content-center' style={{ background: 'rgba(255,255,255,0.2)' }}>
                                <KTIcon iconName='plus' className='fs-2 text-white' />
                            </div>
                            <div className='d-flex flex-column'>
                                <h2 className='text-white fw-bold mb-1 fs-4'>ສ້າງຜູ້ໃຊ້ໃໝ່</h2>
                                <span className='text-white opacity-75 fs-8'>ຕື່ມຂໍ້ມູນຜູ້ໃຊ້ໃຫ້ຄົບຖ້ວນ</span>
                            </div>
                        </div>
                        <button onClick={onClose} className='btn btn-icon btn-sm btn-color-white btn-active-color-white btn-active-light' style={{ background: 'rgba(255,255,255,0.15)' }}>
                            <KTIcon iconName='cross' className='fs-2' />
                        </button>
                    </div>

                    <div className='d-flex border-bottom bg-white'>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} className={`btn btn-active-color-primary btn-color-gray-500 rounded-0 flex-grow-1 py-4 fs-7 fw-bold border-0 ${tab === t.key ? 'text-primary border-bottom border-primary border-2' : ''}`}>
                                <KTIcon iconName={t.icon} className='fs-4 me-2' /> {t.label}
                            </button>
                        ))}
                    </div>

                    <div className='modal-body p-8 bg-white' style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {tab === 'account' && (
                            <div className='row g-5'>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7 required'>ຊື່</label>
                                    <input className={inputClass('first_name')} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder='ຊື່' />
                                    {errors.first_name && <div className='text-danger fs-8 mt-1'>{errors.first_name}</div>}
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7 required'>ນາມສະກຸນ</label>
                                    <input className={inputClass('last_name')} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder='ນາມສະກຸນ' />
                                    {errors.last_name && <div className='text-danger fs-8 mt-1'>{errors.last_name}</div>}
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7 required'>Email</label>
                                    <input className={inputClass('email')} type='email' value={form.email} onChange={e => set('email', e.target.value)} placeholder='example@email.com' />
                                    {errors.email && <div className='text-danger fs-8 mt-1'>{errors.email}</div>}
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7 required'>Username</label>
                                    <input className={inputClass('username')} value={form.username} onChange={e => set('username', e.target.value)} placeholder='Username' />
                                    {errors.username && <div className='text-danger fs-8 mt-1'>{errors.username}</div>}
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7 required'>ລະຫັດຜ່ານ</label>
                                    <input className={inputClass('password')} type='password' value={form.password} onChange={e => set('password', e.target.value)} placeholder='••••••••' />
                                    {errors.password && <div className='text-danger fs-8 mt-1'>{errors.password}</div>}
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7 required'>ສິດການໃຊ້ງານ</label>
                                    <select className='form-select form-select-solid' value={form.role} onChange={e => set('role', e.target.value as 'admin' | 'employee')}>
                                        <option value='employee'>Employee (ພະນັກງານ)</option>
                                        <option value='admin'>Admin (ຜູ້ດູແລ)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {tab === 'business' && (
                            <div className='row g-5'>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7'>ຊື່ບໍລິສັດ</label>
                                    <input className='form-control form-control-solid' value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder='ບໍລິສັດ...' />
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7'>ເລກທະບຽນ (Tax ID)</label>
                                    <input className='form-control form-control-solid' value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder='0100-0000-0000' />
                                </div>
                                <div className='col-md-12'>
                                    <label className='form-label fw-bold fs-7'>ເວັບໄຊທ໌</label>
                                    <input className='form-control form-control-solid' value={form.website} onChange={e => set('website', e.target.value)} placeholder='https://www.example.com' />
                                </div>
                                <div className='col-md-12'>
                                    <div className='separator separator-dashed my-2'></div>
                                    <div className='text-uppercase text-muted fw-bold fs-8 mt-2'>📍 ທີ່ຢູ່</div>
                                </div>
                                <div className='col-md-12'>
                                    <label className='form-label fw-bold fs-7'>ທີ່ຢູ່</label>
                                    <input className='form-control form-control-solid' value={form.address.addressLine} onChange={e => set('address', { ...form.address, addressLine: e.target.value })} placeholder='ຖະໜົນ, ບ້ານ...' />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label fw-bold fs-7'>ເມືອງ</label>
                                    <input className='form-control form-control-solid' value={form.address.city} onChange={e => set('address', { ...form.address, city: e.target.value })} placeholder='ວຽງຈັນ' />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label fw-bold fs-7'>ແຂວງ</label>
                                    <input className='form-control form-control-solid' value={form.address.state} onChange={e => set('address', { ...form.address, state: e.target.value })} placeholder='ວຽງຈັນ' />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label fw-bold fs-7'>ລະຫັດໄປສະນີ</label>
                                    <input className='form-control form-control-solid' value={form.address.postCode} onChange={e => set('address', { ...form.address, postCode: e.target.value })} placeholder='01000' />
                                </div>
                            </div>
                        )}

                        {tab === 'locale' && (
                            <div className='row g-5'>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7'>ສະກຸນເງິນ</label>
                                    <select className='form-select form-select-solid' value={form.currency} onChange={e => set('currency', e.target.value as 'LAK' | 'THB' | 'USD')}>
                                        <option value='LAK'>LAK — ກີບລາວ (₭)</option>
                                        <option value='THB'>THB — ບາດໄท (฿)</option>
                                        <option value='USD'>USD — ໂດລາ ($)</option>
                                    </select>
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label fw-bold fs-7'>ພາສາ</label>
                                    <select className='form-select form-select-solid' value={form.language} onChange={e => set('language', e.target.value as 'en' | 'lo' | 'th')}>
                                        <option value='lo'>ລາວ (ພາສາລາວ)</option>
                                        <option value='en'>English (US)</option>
                                        <option value='th'>Thai (ไทย)</option>
                                    </select>
                                </div>
                                <div className='col-md-12'>
                                    <div className='separator separator-dashed my-2'></div>
                                    <div className='text-uppercase text-muted fw-bold fs-8 mt-2 mb-4'>🔔 ການແຈ້ງເຕືອນ</div>
                                    <div className='d-flex flex-column gap-4'>
                                        {[
                                            { key: 'emailNotification', label: 'ແຈ້ງເຕືອນທາງ Email', sub: 'ຮັບການແຈ້ງເຕືອນໃໝ່ທາງ Email' },
                                            { key: 'sendCopyToPersonalEmail', label: 'ສຳເນົາໄປ Email ສ່ວນຕົວ', sub: 'ສົ່ງສຳເນົາຂໍ້ຄວາມທາງ Email ສ່ວນຕົວ' },
                                        ].map(item => (
                                            <div key={item.key} className='d-flex align-items-center justify-content-between p-4 rounded border border-dashed border-gray-300 bg-light'>
                                                <div className='d-flex flex-column'>
                                                    <span className='fw-bold text-gray-800 fs-6'>{item.label}</span>
                                                    <span className='text-muted fs-8'>{item.sub}</span>
                                                </div>
                                                <div className='form-check form-switch form-check-custom form-check-solid'>
                                                    <input className='form-check-input' type='checkbox' checked={form.settings[item.key as keyof typeof form.settings]} onChange={e => set('settings', { ...form.settings, [item.key]: e.target.checked })} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='modal-footer border-top p-6 bg-light d-flex justify-content-between align-items-center'>
                        <div className='d-flex gap-2'>
                            {TABS.map(t => (
                                <div key={t.key} className={`rounded-circle w-10px h-10px cursor-pointer ${tab === t.key ? 'bg-primary' : 'bg-gray-300'}`} onClick={() => setTab(t.key)} style={{ transition: 'background 0.2s' }} />
                            ))}
                        </div>
                        <div className='d-flex gap-3'>
                            <button className='btn btn-light fw-bold' onClick={onClose} disabled={loading}>
                                ຍົກເລີກ
                            </button>
                            <button className='btn btn-primary fw-bold d-flex align-items-center gap-2' onClick={handleSubmit} disabled={loading}>
                                {loading ? <span className='spinner-border spinner-border-sm' /> : <KTIcon iconName='plus' className='fs-3' />}
                                {loading ? 'ກຳລັງບັນທຶກ...' : 'ສ້າງຜູ້ໃຊ້'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddUserModal