import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { KTIcon } from '../../../../_metronic/helpers';
import { QuotationModel, Customer, Item, LineItem, AdminOptions } from './QuotationModel';
import { useAuth } from '../../../../app/modules/auth';

// ─── Types ────────────────────────────────────────────────────
interface Props {
    show: boolean;
    handleClose: () => void;
    onSave: (data: QuotationModel) => void;
    quotation: QuotationModel | null;
}

interface ApiResponse<T> {
    success?: boolean;
    data?: T;
    quotation?: T;
    message?: string;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
    show: boolean;
    type: ToastType;
    title: string;
    message: string;
}

// ─── Constants ────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_APP_API_URL;

const exchangeRates: Record<string, number> = {
    LAK: 1,
    USD: 21000,
    THB: 690,
};

const unitTranslations: Record<string, string> = {
    Item: 'ເຄື່ອງ', Hour: 'ຊົ່ວໂມງ', Day: 'ມື້', Month: 'ເດືອນ', Year: 'ປີ',
};

const formatMoney = (amount: number, currency: string): number => {
    if (!amount) return 0;
    if (currency === 'LAK') return Math.ceil(amount / 1000) * 1000;
    return Number(amount.toFixed(2));
};

// ─── Toast Config ─────────────────────────────────────────────
const toastConfig: Record<ToastType, { alertClass: string; title: string; icon: JSX.Element }> = {
    success: {
        alertClass: 'alert-success',
        title: 'ສຳເລັດ!',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path opacity="0.3" d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" fill="currentColor" />
                <path d="M10.4343 12.4343L8.75 10.75C8.33579 10.3358 7.66421 10.3358 7.25 10.75C6.83579 11.1642 6.83579 11.8358 7.25 12.25L10.2929 15.2929C10.6834 15.6834 11.3166 15.6834 11.7071 15.2929L17.25 9.75C17.6642 9.33579 17.6642 8.66421 17.25 8.25C16.8358 7.83579 16.1642 7.83579 15.75 8.25L11.5657 12.4343C11.2533 12.7467 10.7467 12.7467 10.4343 12.4343Z" fill="currentColor" />
            </svg>
        ),
    },
    error: {
        alertClass: 'alert-danger',
        title: 'ເກີດຂໍ້ຜິດພາດ!',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path opacity="0.3" d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" fill="currentColor" />
                <path d="M12 15C11.4477 15 11 14.5523 11 14V10C11 9.44772 11.4477 9 12 9C12.5523 9 13 9.44772 13 10V14C13 14.5523 12.5523 15 12 15Z" fill="currentColor" />
                <path d="M12 17.5C11.4477 17.5 11 17.0523 11 16.5C11 15.9477 11.4477 15.5 12 15.5C12.5523 15.5 13 15.9477 13 16.5C13 17.0523 12.5523 17.5 12 17.5Z" fill="currentColor" />
            </svg>
        ),
    },
    warning: {
        alertClass: 'alert-warning',
        title: 'ກະລຸນາກວດສອບ!',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path opacity="0.3" d="M20.5543 4.37824L12.1798 2.02473C12.0626 1.99176 11.9376 1.99176 11.8203 2.02473L3.44572 4.37824C3.18118 4.45258 3 4.6807 3 4.93945V13.569C3 14.6914 3.48509 15.8404 4.4417 16.984C5.17231 17.8575 6.18314 18.7345 7.446 19.5773C9.56752 21.0244 11.6566 21.912 11.7445 21.9488C11.8258 21.9829 11.9129 22 12.0001 22C12.0872 22 12.1744 21.983 12.2557 21.9488C12.3435 21.912 14.4326 21.0244 16.5541 19.5773C17.8169 18.7345 18.8277 17.8575 19.5584 16.984C20.515 15.8404 21 14.6914 21 13.569V4.93945C21 4.6807 20.8189 4.45258 20.5543 4.37824Z" fill="currentColor" />
                <path d="M12 15C11.4477 15 11 14.5523 11 14V10C11 9.44772 11.4477 9 12 9C12.5523 9 13 9.44772 13 10V14C13 14.5523 12.5523 15 12 15Z" fill="currentColor" />
                <path d="M12 17.5C11.4477 17.5 11 17.0523 11 16.5C11 15.9477 11.4477 15.5 12 15.5C12.5523 15.5 13 15.9477 13 16.5C13 17.0523 12.5523 17.5 12 17.5Z" fill="currentColor" />
            </svg>
        ),
    },
    info: {
        alertClass: 'alert-primary',
        title: 'ຂໍ້ມູນ',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path opacity="0.3" d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" fill="currentColor" />
                <path d="M12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8C13 8.55228 12.5523 9 12 9Z" fill="currentColor" />
                <path d="M11 16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12V16Z" fill="currentColor" />
            </svg>
        ),
    },
};

// ─── Toast Component ──────────────────────────────────────────
const Toast: React.FC<{ toast: ToastState; onClose: () => void }> = ({ toast, onClose }) => {
    if (!toast.show) return null;
    const config = toastConfig[toast.type];
    return (
        <div style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            minWidth: '320px', maxWidth: '400px',
            animation: 'toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
        }}>
            <style>{`
                @keyframes toastSlideIn {
                    from { transform: translateY(24px) scale(0.95); opacity: 0; }
                    to   { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
            <div className={`alert ${config.alertClass} d-flex align-items-center p-5 shadow`}
                style={{ borderRadius: '14px', marginBottom: 0, gap: '12px' }}>
                <span className='svg-icon svg-icon-2hx flex-shrink-0'>{config.icon}</span>
                <div className='d-flex flex-column flex-grow-1'>
                    <h5 className='mb-1 fw-bold'>{config.title}</h5>
                    <span className='fs-6'>{toast.message}</span>
                </div>
                <button type='button' className='btn btn-icon btn-sm ms-auto flex-shrink-0'
                    style={{ width: '28px', height: '28px' }} onClick={onClose}>
                    <i className='bi bi-x fs-2'></i>
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────
const EditQuotation: React.FC<Props> = ({ show, handleClose, onSave, quotation }) => {
    const { currentUser } = useAuth();
    const userRole = (currentUser as { role?: string } | undefined)?.role || 'employee';

    // ─── State ────────────────────────────────────────────────
    const [adminList, setAdminList]             = useState<AdminOptions[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [customers, setCustomers]             = useState<Customer[]>([]);
    const [allItems, setAllItems]               = useState<Item[]>([]);
    const [loading, setLoading]                 = useState<boolean>(false);
    const [formData, setFormData]               = useState<Partial<QuotationModel>>({});
    const [toast, setToast]                     = useState<ToastState>({ show: false, type: 'success', title: '', message: '' });

    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ show: true, type, title: toastConfig[type].title, message });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
    }, []);

    const hideToast = useCallback(() => setToast(t => ({ ...t, show: false })), []);

    // ─── Load quotation into form ─────────────────────────────
    useEffect(() => {
        if (show && quotation) {
            setFormData({
                ...quotation,
                customer: typeof quotation.customer === 'object'
                    ? (quotation.customer as Customer)._id
                    : quotation.customer,
            });
            setSelectedAdminId('');
        }
    }, [show, quotation]);

    // ─── Fetch Dropdowns ──────────────────────────────────────
    useEffect(() => {
        if (!show) return;
        const fetchAll = async () => {
            try {
                const [custRes, itemRes, adminRes] = await Promise.all([
                    axios.get<Customer[] | ApiResponse<Customer[]>>(`${API_URL}/Customer`),
                    axios.get<Item[]     | ApiResponse<Item[]>>    (`${API_URL}/itemServices`),
                    axios.get<ApiResponse<AdminOptions[]>>           (`${API_URL}/quotations/admin-list`),
                ]);
                const extract = <T,>(r: T | ApiResponse<T>): T =>
                    (r && typeof r === 'object' && 'data' in r) ? (r as ApiResponse<T>).data as T : r as T;
                setCustomers(extract(custRes.data) || []);
                setAllItems(extract(itemRes.data)  || []);
                setAdminList(adminRes.data.data    || []);
            } catch {
                showToast('error', 'ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້ ກະລຸນາລອງໃໝ່!');
            }
        };
        fetchAll();
    }, [show, showToast]);

    // ─── Totals ───────────────────────────────────────────────
    const updateTotals = useCallback((items: LineItem[], extra?: Partial<QuotationModel>) => {
        setFormData(prev => {
            const ctx = { ...prev, ...extra };
            const cur = ctx.currency || 'LAK';
            const updated = items.map(item => {
                const amount    = (item.price || 0) * (item.quantity || 0);
                const taxAmount = amount * (item.taxRate || 0) / 100;
                return {
                    ...item,
                    amount:    formatMoney(amount,             cur),
                    taxAmount: formatMoney(taxAmount,          cur),
                    total:     formatMoney(amount + taxAmount, cur),
                };
            });
            const subtotal   = updated.reduce((s, i) => s + (i.amount    || 0), 0);
            const totalTax   = updated.reduce((s, i) => s + (i.taxAmount || 0), 0);
            return { ...ctx, lineItems: updated, subtotal, totalTax, grandTotal: subtotal + totalTax };
        });
    }, []);

    const addItem = (type: 'Product' | 'Service') => {
        const newItem: LineItem = {
            item: '', name: '', type, quantity: 1, price: 0,
            taxRate: 0, amount: 0, taxAmount: 0, total: 0,
            unit: type === 'Service' ? 'Hour' : 'Item',
        };
        updateTotals([...(formData.lineItems || []), newItem]);
    };

    const handleSelectItem = (index: number, itemCode: string) => {
        const selected = allItems.find(i => i.ItemCode === itemCode);
        if (!selected) return;
        const cur  = formData.currency || 'LAK';
        const rate = exchangeRates[cur] || 1;
        const items = [...(formData.lineItems || [])];
        items[index] = {
            ...items[index],
            item: selected._id, name: selected.Iname,
            price: formatMoney(selected.price / rate, cur),
            taxRate: selected.taxRate, type: selected.type,
            unit: selected.unit || (selected.type === 'Service' ? 'Hour' : 'Item'),
        };
        updateTotals(items);
    };

    const handleItemChange = <K extends keyof LineItem>(index: number, field: K, value: LineItem[K]) => {
        const items = [...(formData.lineItems || [])];
        items[index] = { ...items[index], [field]: value };
        updateTotals(items);
    };

    const removeItem = (index: number) =>
        updateTotals((formData.lineItems || []).filter((_, i) => i !== index));

    const handleCurrencyChange = (newCurrency: 'LAK' | 'USD' | 'THB') => {
        const oldCurrency = formData.currency || 'LAK';
        if (oldCurrency === newCurrency) return;
        const oldRate = exchangeRates[oldCurrency];
        const newRate = exchangeRates[newCurrency];
        const items = (formData.lineItems || []).map(item => ({
            ...item,
            price: formatMoney((item.price || 0) * oldRate / newRate, newCurrency),
        }));
        updateTotals(items, { currency: newCurrency, exchangeRate: newRate });
    };

    const getCurrencySymbol = () => {
        if (formData.currency === 'USD') return '$';
        if (formData.currency === 'THB') return '฿';
        return '₭';
    };

    const fractionDigits = formData.currency === 'LAK' ? 0 : 2;

    // ─── Save ─────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.customer) { showToast('warning', 'ກະລຸນາເລືອກລູກຄ້າກ່ອນບັນທຶກ'); return; }
        if (!formData.lineItems?.length) { showToast('warning', 'ກະລຸນາເພີ່ມລາຍການຢ່າງໜ້ອຍ 1 ລາຍການ'); return; }
        if (formData.status === 'Sent' && !selectedAdminId) {
            showToast('warning', 'ກະລຸນາເລືອກ Admin ຜູ້ກວດສອບ'); return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                assignedAdminId: selectedAdminId || undefined,
                exchangeRate: exchangeRates[formData.currency || 'LAK'],
            };

            const res = await axios.patch<ApiResponse<QuotationModel>>(
                `${API_URL}/quotations/${quotation?._id}`,
                payload
            );
            
            if (res.data.success && res.data.quotation) {
                onSave(res.data.quotation);
                showToast('success', 'ແກ້ໄຂໃບສະເໜີສຳເລັດແລ້ວ!');
                setTimeout(handleClose, 1500);
            }
        } catch (error) {
            const e = error as AxiosError<ApiResponse<never>>;
            showToast('error', e.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ ກະລຸນາລອງໃໝ່!');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <>
            <div className='modal fade show d-block' tabIndex={-1}
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1055 }}>
                <div className='modal-dialog modal-xl modal-dialog-centered'>
                    <div className='modal-content shadow-lg'>

                        {/* ── Header ── */}
                        <div className='modal-header'>
                            <div className='d-flex align-items-center gap-3'>
                                <h3 className='modal-title fw-bold mb-0'>ແກ້ໄຂໃບສະເໜີລາຄາ</h3>
                                <span className='badge badge-light-warning fs-7 py-2 px-3'>
                                    {quotation?.quotationId}
                                </span>
                            </div>
                            <div className='btn btn-icon btn-sm btn-active-light-primary ms-2' onClick={handleClose}>
                                <KTIcon iconName='cross' className='fs-1' />
                            </div>
                        </div>

                        <div className='modal-body'>

                            {/* ── Row 1: ID / Customer / Status ── */}
                            <div className='row g-9 mb-5'>
                                <div className='col-md-3'>
                                    <label className='form-label fw-bold'>ເລກທີໃບສະເໜີ</label>
                                    <input type='text' className='form-control form-control-solid'
                                        value={quotation?.quotationId || ''} readOnly />
                                </div>

                                <div className='col-md-6'>
                                    <label className='form-label fw-bold required'>ເລືອກລູກຄ້າ</label>
                                    <select className='form-select form-select-solid'
                                        value={formData.customer as string || ''}
                                        onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                                        <option value="">-- ເລືອກລູກຄ້າ --</option>
                                        {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className='col-md-3'>
                                    <label className='form-label fw-bold required'>ສະຖານະ</label>
                                    <select className='form-select form-select-solid'
                                        value={formData.status || ''}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as QuotationModel['status'] })}>
                                        <option value='Draft'>Draft (ຮ່າງ)</option>
                                        <option value='Sent'>Sent (ສົ່ງໃຫ້ Admin ກວດສອບ)</option>
                                        {userRole === 'admin' && (
                                            <option value='Approved'>Approved (ອະນຸມັດ)</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* ── Admin Dropdown (ສະເພາະ Sent) ── */}
                            {formData.status === 'Sent' && (
                                <div className='row g-9 mb-5'>
                                    <div className='col-md-6'>
                                        <label className='form-label fw-bold required'>
                                            ເລືອກ Admin ຜູ້ກວດສອບ
                                        </label>
                                        <select className='form-select form-select-solid'
                                            value={selectedAdminId}
                                            onChange={e => setSelectedAdminId(e.target.value)}>
                                            <option value="">-- ເລືອກຜູ້ອະນຸມັດ --</option>
                                            {adminList.map(a => (
                                                <option key={a._id} value={a._id}>
                                                    {a.first_name} {a.last_name}
                                                </option>
                                            ))}
                                        </select>
                                        {adminList.length === 0 && (
                                            <div className='text-muted fs-7 mt-1'>
                                                ⚠️ ບໍ່ພົບ Admin ໃນລະບົບ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Row 2: Dates / Currency ── */}
                            <div className='row g-9 mb-8'>
                                <div className='col-md-4'>
                                    <label className='form-label fw-bold required'>ວັນທີອອກເອກະສານ</label>
                                    <input type='date' className='form-control form-control-solid'
                                        value={formData.issueDate
                                            ? new Date(formData.issueDate).toISOString().split('T')[0] : ''}
                                        onChange={e => updateTotals(
                                            formData.lineItems || [],
                                            { issueDate: new Date(e.target.value) }
                                        )} />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label fw-bold required'>ວັນໝົດອາຍຸ</label>
                                    <input type='date' className='form-control form-control-solid'
                                        value={formData.validUntil
                                            ? new Date(formData.validUntil).toISOString().split('T')[0] : ''}
                                        onChange={e => updateTotals(
                                            formData.lineItems || [],
                                            { validUntil: new Date(e.target.value) }
                                        )} />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label fw-bold required'>ສະກຸນເງິນ</label>
                                    <select className='form-select form-select-solid'
                                        value={formData.currency || 'LAK'}
                                        onChange={e => handleCurrencyChange(e.target.value as QuotationModel['currency'])}>
                                        <option value='LAK'>LAK (₭)</option>
                                        <option value='USD'>USD ($)</option>
                                        <option value='THB'>THB (฿)</option>
                                    </select>
                                </div>
                            </div>

                            <div className='separator separator-dashed my-10'></div>

                            {/* ── Line Items ── */}
                            <div className='d-flex flex-stack mb-5'>
                                <div className='fw-bold fs-4 text-gray-800'>ລາຍການສິນຄ້າ/ບໍລິການ</div>
                                <div className='d-flex gap-3'>
                                    <button type='button' className='btn btn-sm btn-light-primary'
                                        onClick={() => addItem('Product')}>
                                        <KTIcon iconName='plus' className='fs-3' /> ເພີ່ມສິນຄ້າ
                                    </button>
                                    <button type='button' className='btn btn-sm btn-light-success'
                                        onClick={() => addItem('Service')}>
                                        <KTIcon iconName='plus' className='fs-3' /> ເພີ່ມບໍລິການ
                                    </button>
                                </div>
                            </div>

                            <div className='table-responsive'>
                                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                                    <thead>
                                        <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                                            <th className='min-w-250px'>ລາຍການ</th>
                                            <th className='min-w-100px text-center'>ຈຳນວນ</th>
                                            <th className='min-w-150px text-end'>ລາຄາຕໍ່ໜ່ວຍ</th>
                                            <th className='min-w-100px text-end'>ພາສີ (%)</th>
                                            <th className='min-w-150px text-end'>ລວມສຸດທິ</th>
                                            <th className='text-end'>ລຶບ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(formData.lineItems || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className='text-center py-10 text-muted fw-semibold'>
                                                    ຍັງບໍ່ມີລາຍການ — ກົດ "ເພີ່ມສິນຄ້າ" ຫຼື "ເພີ່ມບໍລິການ"
                                                </td>
                                            </tr>
                                        ) : formData.lineItems?.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <select className='form-select form-select-sm form-select-solid'
                                                        onChange={e => handleSelectItem(index, e.target.value)}
                                                        value={allItems.find(i => i._id === item.item)?.ItemCode || ''}>
                                                        <option value="">-- ເລືອກ {item.type} --</option>
                                                        {allItems.filter(i => i.type === item.type).map(i => (
                                                            <option key={i._id} value={i.ItemCode}>
                                                                [{i.ItemCode}] {i.Iname}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className='text-muted fs-7 mt-1'>
                                                        ຫົວໜ່ວຍ: {unitTranslations[item.unit] || item.unit}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input type='number'
                                                        className='form-control form-control-sm text-center'
                                                        value={item.quantity}
                                                        onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} />
                                                </td>
                                                <td>
                                                    <input type='number'
                                                        className='form-control form-control-sm text-end'
                                                        value={item.price}
                                                        onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} />
                                                </td>
                                                <td className='text-end'>
                                                    <input type='number'
                                                        className='form-control form-control-sm text-end'
                                                        value={item.taxRate}
                                                        onChange={e => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)} />
                                                </td>
                                                <td className='text-end fw-bold text-dark'>
                                                    {item.total.toLocaleString(undefined, { minimumFractionDigits: fractionDigits })} {getCurrencySymbol()}
                                                </td>
                                                <td className='text-end'>
                                                    <button className='btn btn-icon btn-sm btn-light-danger'
                                                        onClick={() => removeItem(index)}>
                                                        <KTIcon iconName='trash' className='fs-3' />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Totals ── */}
                            <div className='d-flex justify-content-end mt-5'>
                                <div className='mw-300px w-100 bg-light p-5 rounded'>
                                    <div className='d-flex flex-stack mb-3'>
                                        <span className='text-gray-600'>ລວມກ່ອນພາສີ:</span>
                                        <span className='fw-bold'>
                                            {formData.subtotal?.toLocaleString(undefined, { minimumFractionDigits: fractionDigits })} {getCurrencySymbol()}
                                        </span>
                                    </div>
                                    <div className='d-flex flex-stack mb-3'>
                                        <span className='text-gray-600'>ພາສີທັງໝົດ:</span>
                                        <span className='fw-bold'>
                                            {formData.totalTax?.toLocaleString(undefined, { minimumFractionDigits: fractionDigits })} {getCurrencySymbol()}
                                        </span>
                                    </div>
                                    <div className='separator separator-dashed my-3'></div>
                                    <div className='d-flex flex-stack'>
                                        <span className='fw-bold fs-3 text-dark'>ລວມສຸດທິ:</span>
                                        <span className='fw-bold text-primary fs-2'>
                                            {formData.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: fractionDigits })} {getCurrencySymbol()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className='modal-footer bg-light'>
                            <button type='button' className='btn btn-light' onClick={handleClose}>
                                ຍົກເລີກ
                            </button>
                            <button type='button' className='btn btn-primary fw-bold'
                                onClick={handleSave} disabled={loading}>
                                {loading ? (
                                    <><span className='spinner-border spinner-border-sm me-2'></span>ກຳລັງບັນທຶກ...</>
                                ) : 'ບັນທຶກການແກ້ໄຂ'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <Toast toast={toast} onClose={hideToast} />
        </>
    );
};

export default EditQuotation;