import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';
import { QuotationModel, Customer } from '../componetQuitation/QuotationModel';
import { KTIcon } from '../../../../_metronic/helpers';
import Swal from 'sweetalert2';
import { useAuth } from '../../../../app/modules/auth'; 

export interface UserData {
    _id?: string;
    first_name?: string;
    last_name?: string;
    pic?: string;
    picUrl?: string;
    companyName?: string;
    address?: {
        addressLine?: string;
        city?: string;
        state?: string;
        postCode?: string;
    };
    country?: string;
    website?: string;
    phone?: string;
    email?: string;
    role?: string;
}

interface AdminOption {
    _id: string;
    first_name: string;
    last_name: string;
}

interface ExtendedQuotation extends QuotationModel {
    user?: UserData;
    createdBy?: UserData;
}

interface Props {
    show: boolean;
    handleClose: () => void;
    quotationId: string | null;
    onUpdate?: () => void;
}

// 🌟 ກຳນົດ Type ໃຫ້ກັບ LocalStorage Data ທີ່ Parse ອອກມາ
interface AuthStorageData {
    role?: string;
    data?: { role?: string };
    user?: { role?: string };
}

const API_URL = import.meta.env.VITE_APP_API_URL as string;

// ─── Component ────────────────────────────────────────────────
const QuotationDetailModal: React.FC<Props> = ({ show, handleClose, quotationId, onUpdate }) => {
    const { auth } = useAuth(); // 🌟 ດຶງ Token ມາໃຊ້ງານ
    const [data, setData]                     = useState<ExtendedQuotation | null>(null);
    const [loading, setLoading]               = useState<boolean>(false);
    const [isSaving, setIsSaving]             = useState<boolean>(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('employee');

    // ── Admin Selector State ──
    const [adminList, setAdminList]             = useState<AdminOption[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [showAdminPicker, setShowAdminPicker] = useState<boolean>(false);

    // ─── ດຶງ Role ຈາກ LocalStorage ──────────────────────────
    useEffect(() => {
        const authDataString = localStorage.getItem('kt-auth-react-v');
        if (authDataString) {
            try {
                // 🌟 ກຳນົດ Type ແທນການປ່ອຍໃຫ້ເປັນ any
                const authData = JSON.parse(authDataString) as AuthStorageData;
                const role = authData?.role || authData?.data?.role || authData?.user?.role || 'employee';
                setCurrentUserRole(role);
            } catch (e: unknown) {
                console.error("Failed to parse auth data", e);
            }
        }
    }, []);

    // ─── ດຶງລາຍລະອຽດໃບສະເໜີ ─────────────────────────────────
    useEffect(() => {
        if (!show || !quotationId) return;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const { data: result } = await axios.get(`${API_URL}/quotations/${quotationId}`, {
                    headers: { Authorization: `Bearer ${auth?.api_token}` } 
                });
                setData(result.data || result);
            } catch (error: unknown) {
                console.error("Fetch error:", error);
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    Swal.fire({ icon: 'error', title: 'ໝົດເວລາ Session', text: 'ກະລຸນາ Login ໃໝ່ອີກຄັ້ງ' });
                }
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
        setShowAdminPicker(false);
        setSelectedAdminId('');
    }, [show, quotationId, auth?.api_token]);

    // ─── ດຶງລາຍຊື່ Admin ─────────────────────────────────────
    useEffect(() => {
        if (!show || currentUserRole !== 'employee') return;
        axios.get<{ data: AdminOption[] }>(`${API_URL}/quotations/admin-list`, {
            headers: { Authorization: `Bearer ${auth?.api_token}` } // 🌟 ແນບ Header
        })
            .then(res => setAdminList(res.data.data || []))
            .catch((err: unknown) => console.error("Load admins fail:", err));
    }, [show, currentUserRole, auth?.api_token]);

    // ─── Derived ─────────────────────────────────────────────
    const customerData = data?.customer as unknown as Customer | undefined;
    const userData: UserData | undefined = data?.createdBy || data?.user;

    const handlePrint = (): void => window.print();

    // ── 1. ກົດ "ສົ່ງໃຫ້ Admin" → ສະແດງ Picker ──────────────
    const handleClickSend = (): void => {
        if (adminList.length === 0) {
            Swal.fire('ຜິດພາດ!', 'ບໍ່ພົບ Admin ໃນລະບົບ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລ', 'error');
            return;
        }
        setShowAdminPicker(true);
    };

    // ── 2. ຢືນຢັນສົ່ງຫຼັງເລືອກ Admin ──────────────────────────
    const handleConfirmSend = async (): Promise<void> => {
        if (!selectedAdminId) {
            Swal.fire('ກະລຸນາເລືອກ Admin', 'ກະລຸນາເລືອກ Admin ຜູ້ກວດສອບກ່ອນ', 'warning');
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'ຢືນຢັນການສົ່ງ?',
            text: "ທ່ານຕ້ອງການສົ່ງໃບສະເໜີລາຄານີ້ໃຫ້ Admin ກວດສອບແທ້ບໍ່?",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#009ef7',
            cancelButtonColor: '#8a909d',
            confirmButtonText: 'ສົ່ງກວດສອບ',
            cancelButtonText: 'ຍົກເລີກ',
            reverseButtons: true,
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setIsSaving(true);
            await axios.patch(`${API_URL}/quotations/${data?._id}/status`, 
                { status: 'Sent', assignedAdminId: selectedAdminId },
                { headers: { Authorization: `Bearer ${auth?.api_token}` } } // 🌟 ແນບ Header
            );

            await Swal.fire('ສຳເລັດ!', 'ສົ່ງໃຫ້ Admin ກວດສອບແລ້ວ.', 'success');
            handleClose();
            if (onUpdate) onUpdate();
        } catch (error: unknown) { // 🌟 ປ່ຽນເປັນ unknown
            const msg = axios.isAxiosError<{message?: string}>(error) ? error.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ' : 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີເວີ';
            Swal.fire('ຜິດພາດ!', msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── 3. Admin: Approve & Invoice ───────────────────────────
    const handleApproveAndInvoice = async (): Promise<void> => {
        if (!data) return;

        const confirmResult = await Swal.fire({
            title: 'ຢືນຢັນການອະນຸມັດ?',
            text: "ທ່ານຕ້ອງການອະນຸມັດ ແລະ ສ້າງໃບແຈ້ງໜີ້ແທ້ບໍ່?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#8a909d',
            confirmButtonText: 'ຢືນຢັນ',
            cancelButtonText: 'ຍົກເລີກ',
            reverseButtons: true,
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setIsSaving(true);
            await axios.patch(`${API_URL}/quotations/${data._id}/status`, 
                { status: 'Approved' },
                { headers: { Authorization: `Bearer ${auth?.api_token}` } } 
            );

            await Swal.fire('ສຳເລັດ!', 'ອະນຸມັດ ແລະ ສ້າງໃບແຈ້ງໜີ້ສຳເລັດແລ້ວ.', 'success');
            handleClose();
            if (onUpdate) onUpdate();
        } catch (error: unknown) { // 🌟 ປ່ຽນເປັນ unknown
            const msg = axios.isAxiosError<{message?: string}>(error) ? error.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ' : 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີເວີ';
            Swal.fire('ຜິດພາດ!', msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── 4. Admin: Reject ──────────────────────────────────────
    const handleReject = async (): Promise<void> => {
        if (!data) return;

        const confirmResult = await Swal.fire({
            title: 'ປະຕິເສດໃບສະເໜີລາຄາ?',
            text: "ທ່ານແນ່ໃຈບໍ່ວ່າຈະປະຕິເສດໃບສະເໜີລາຄານີ້?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#8a909d',
            confirmButtonText: 'ປະຕິເສດ',
            cancelButtonText: 'ຍົກເລີກ',
            reverseButtons: true,
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setIsSaving(true);
            await axios.patch(`${API_URL}/quotations/${data._id}/status`, 
                { status: 'Rejected' },
                { headers: { Authorization: `Bearer ${auth?.api_token}` } } // 🌟 ແນບ Header
            );

            await Swal.fire('ສຳເລັດ!', 'ປະຕິເສດໃບສະເໜີລາຄາສຳເລັດແລ້ວ', 'success');
            handleClose();
            if (onUpdate) onUpdate();
        } catch (error: unknown) { // 🌟 ປ່ຽນເປັນ unknown
            const msg = axios.isAxiosError<{message?: string}>(error) ? error.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດ' : 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີເວີ';
            Swal.fire('ຜິດພາດ!', msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Totals ───────────────────────────────────────────────
    let subtotal = 0;
    let taxableAmount = 0;
    let displayTaxRate = 0;

    if (data?.lineItems) {
        data.lineItems.forEach(item => {
            const lineTotal = (item.price || 0) * (item.quantity || 0);
            subtotal += lineTotal;
            if (item.taxRate && item.taxRate > 0) {
                taxableAmount += lineTotal;
                displayTaxRate = item.taxRate;
            }
        });
    }

    const issueDateObj  = data?.issueDate ? new Date(data.issueDate) : new Date();
    const validUntilObj = new Date(issueDateObj);
    validUntilObj.setDate(validUntilObj.getDate() + 30);

    const minRows       = 12;
    const itemsCount    = data?.lineItems?.length || 0;
    const emptyRowsCount = Math.max(0, minRows - itemsCount);

    // ─── Render ───────────────────────────────────────────────
    return (
        <Modal show={show} onHide={handleClose} size='xl' centered backdrop='static' contentClassName="rounded-0 border-0 shadow-lg">
            <style>{`
                .quote-wrapper { font-family: 'Phetsarath OT', 'Arial', sans-serif; color: #000; font-size: 12px; background: #fff; }
                .quote-wrapper * { box-sizing: border-box; }
                .color-primary-bg { background-color: #198754 !important; color: #fff !important; }
                .color-light-bg { background-color: #E8F5E9 !important; }
                .color-light-title { color: #198754 !important; }
                .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                .logo-box { width: 60px; height: 60px; background-color: #198754; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; }
                .meta-table { border-collapse: collapse; width: 220px; float: right; margin-top: 10px;}
                .meta-table td { padding: 3px 5px; font-size: 11px; }
                .meta-table td.label { text-align: right; padding-right: 10px; width: 100px; }
                .meta-table td.value { border: 1px solid #000; text-align: center; }
                .section-title { font-size: 13px; font-weight: bold; padding: 4px 6px; margin-bottom: 5px; width: 45%; }
                .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #000; }
                .items-table th { padding: 6px; text-align: center; font-weight: bold; font-size: 11px; border-bottom: 1px solid #000; }
                .items-table th:first-child { text-align: left; }
                .items-table td { border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; }
                .items-table tr.striped td { background-color: #F9FDF9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;}
                .footer-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; }
                .terms-box { width: 55%; border: 1px solid #000; }
                .terms-title { font-size: 13px; font-weight: bold; padding: 4px 6px; }
                .terms-content { padding: 10px; line-height: 1.6; }
                .totals-table { width: 45%; border-collapse: collapse; }
                .totals-table td { padding: 4px 6px; }
                .totals-table td.label { text-align: right; }
                .totals-table td.currency { width: 20px; border-left: 1px solid transparent; text-align: left;}
                .totals-table td.value { border: 1px solid #000; text-align: right; width: 110px; }
                .totals-table tr.grand-total td { font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; }
                .quote-footer-text { text-align: center; margin-top: 40px; line-height: 1.4; padding-bottom: 20px; }
                .admin-picker-box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body * { visibility: hidden; }
                    .modal-content, .modal-content * { visibility: visible; }
                    .modal-content { position: absolute; left: 0; top: 0; width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; background-color: white !important; margin: 0 !important; }
                    .modal-footer, .btn-close, .d-print-none { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .quote-wrapper { padding: 0; }
                }
            `}</style>

            {/* ─── Body ──────────────────────────────────────── */}
            <div className='modal-body p-0'>
                {loading ? (
                    <div className="d-flex flex-column align-items-center py-20">
                        <div className="spinner-border text-primary mb-4" />
                        <span className="text-gray-600">ກຳລັງໂຫຼດຂໍ້ມູນ...</span>
                    </div>
                ) : data ? (
                    <div className="p-10 p-lg-15 quote-wrapper">

                        {/* Header */}
                        <div className="header-top">
                            <div className="d-flex">
                                {userData?.pic || userData?.picUrl ? (
                                    <img src={userData.picUrl || userData.pic} alt="Logo"
                                        style={{ width: '60px', height: '60px', marginRight: '15px', objectFit: 'cover' }} />
                                ) : (
                                    <div className="logo-box">LOGO</div>
                                )}
                                <div>
                                    <div style={{ fontSize: '24px', color: '#198754', marginBottom: '8px', fontWeight: 'bold' }}>
                                        {userData ? (userData.companyName || `${userData.first_name} ${userData.last_name}`) : 'Community Co., Ltd'}
                                    </div>
                                    <div style={{ lineHeight: '1.4' }}>
                                        {userData ? (userData.address?.addressLine || 'ບໍ່ມີຂໍ້ມູນທີ່ຢູ່') : 'Asean Road, Sibounheuang Village'}<br />
                                        {userData ? `${userData.address?.city || ''} ${userData.address?.state || ''} ${userData.country || ''}` : 'Chanthabouly District, Vientiane, Laos'}<br />
                                        Website: {userData ? (userData.website || '-') : 'www.community.la'}<br />
                                        Phone: {userData ? (userData.phone || '-') : '+856 20 5555 5555'}<br />
                                        Email: {userData ? (userData.email || '-') : 'info@community.la'}<br />
                                        Prepared by: {userData ? `${userData.first_name} ${userData.last_name}` : 'Admin'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="color-light-title" style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px' }}>QUOTE</div>
                                <table className="meta-table">
                                    <tbody>
                                        <tr><td className="label">DATE</td><td className="value">{issueDateObj.toLocaleDateString('en-GB')}</td></tr>
                                        <tr><td className="label">QUOTE #</td><td className="value">{data.quotationId}</td></tr>
                                        <tr><td className="label">CUSTOMER ID</td><td className="value">{customerData?._id?.toString().slice(-6).toUpperCase() || 'N/A'}</td></tr>
                                        <tr><td className="label">VALID UNTIL</td><td className="value">{validUntilObj.toLocaleDateString('en-GB')}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Customer */}
                        <div>
                            <div className="section-title color-primary-bg">CUSTOMER</div>
                            <div style={{ lineHeight: '1.4' }}>
                                {customerData?.name || '[Customer Name]'}<br />
                                {customerData?.contact?.name || '[Contact Name]'}<br />
                                {customerData?.address ? `${customerData.address.district}, ${customerData.address.province}` : '[Street Address]'}<br />
                                Phone: {customerData?.contact?.phone || '[Phone]'}
                            </div>
                        </div>

                        {/* Line Items */}
                        <table className="items-table">
                            <thead>
                                <tr className="color-primary-bg">
                                    <th style={{ width: '45%' }}>DESCRIPTION</th>
                                    <th style={{ width: '15%' }}>UNIT PRICE</th>
                                    <th style={{ width: '10%' }}>QTY</th>
                                    <th style={{ width: '10%' }}>TAX RATE</th>
                                    <th style={{ width: '20%' }}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderBottom: '1px solid #000' }}>
                                {data.lineItems?.map((item, index) => (
                                    <tr key={index} className={index % 2 !== 0 ? 'striped' : ''}>
                                        <td>{item.name} {item.type ? `(${item.type})` : ''}</td>
                                        <td style={{ textAlign: 'right' }}>{item.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'center' }}>{item.taxRate ? `${item.taxRate}%` : '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {[...Array(emptyRowsCount)].map((_, i) => {
                                    const actualIndex = itemsCount + i;
                                    return (
                                        <tr key={`empty-${i}`} className={actualIndex % 2 !== 0 ? 'striped' : ''}>
                                            <td style={{ color: 'transparent' }}>-</td><td></td><td></td><td></td><td style={{ textAlign: 'right' }}>-</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Footer Grid */}
                        <div className="footer-grid">
                            <div className="terms-box">
                                <div className="terms-title color-primary-bg">ເງື່ອນໄຂ ແລະ ຂໍ້ຕົກລົງ (TERMS & CONDITIONS)</div>
                                <div className="terms-content">
                                    1. ລູກຄ້າຈະຖືກຮຽກເກັບເງິນ ຫຼັງຈາກການຢືນຢັນຍອມຮັບໃບສະເໜີລາຄານີ້.<br />
                                    2. ກະລຸນາຊຳລະເງິນກ່ອນການຈັດສົ່ງສິນຄ້າ ຫຼື ການໃຫ້ບໍລິການ.<br />
                                    3. ກະລຸນາສົ່ງໃບສະເໜີລາຄາທີ່ເຊັນຢັ້ງຢືນແລ້ວ ກັບຄືນຫາບໍລິສັດ.<br /><br />
                                    <i style={{ color: '#333', fontWeight: 'bold' }}>ການຢັ້ງຢືນຍອມຮັບ (Customer Acceptance):</i><br /><br /><br />
                                    ລາຍເຊັນ (Signature): _______________________________________<br /><br />
                                    ຊື່ແຈ້ງ (Print Name): _______________________________________<br /><br />
                                    ວັນທີ (Date): ______________________________________________
                                </div>
                            </div>

                            <table className="totals-table">
                                <tbody>
                                    <tr>
                                        <td className="label">ລວມເງິນ (Subtotal)</td>
                                        <td className="currency">{data.currency || '₭'}</td>
                                        <td className="value">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">ຍອດຄິດໄລ່ອາກອນ (Taxable)</td>
                                        <td className="currency">{data.currency || '₭'}</td>
                                        <td className="value">{taxableAmount > 0 ? taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">ອັດຕາອາກອນ (Tax rate)</td>
                                        <td className="currency"></td>
                                        <td className="value" style={{ border: '1px solid #000' }}>
                                            {displayTaxRate > 0 ? `${displayTaxRate}%` : '0.00%'}
                                        </td>
                                    </tr>
                                    <tr className="grand-total color-light-bg">
                                        <td className="label">ລວມທັງໝົດ (TOTAL)</td>
                                        <td className="currency">{data.currency || '₭'}</td>
                                        <td className="value">{data.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="quote-footer-text">
                            ຫາກທ່ານມີຂໍ້ສົງໄສກ່ຽວກັບໃບສະເໜີລາຄານີ້, ກະລຸນາຕິດຕໍ່:<br />
                            {userData ? `[${userData.first_name}, ${userData.phone || '-'}, ${userData.email || '-'}]` : '[Admin, +856 20 5555 5555, info@community.la]'}<br />
                            <b style={{ fontStyle: 'italic', fontSize: '13px', display: 'block', marginTop: '5px' }}>ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ! (Thank You For Your Business!)</b>
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center text-danger fw-bold">ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໄດ້</div>
                )}
            </div>

            {/* ─── Footer ────────────────────────────────────── */}
            <div className="modal-footer bg-light border-0 d-print-none flex-column align-items-stretch gap-3">

                {/* ── Admin Picker (ສະແດງຕອນ Employee ກົດສົ່ງ) ── */}
                {showAdminPicker && currentUserRole === 'employee' && data?.status === 'Draft' && (
                    <div className="admin-picker-box">
                        <span className="fw-bold text-gray-700 me-2">ເລືອກ Admin ຜູ້ກວດສອບ:</span>
                        <select
                            className="form-select form-select-sm w-auto flex-grow-1"
                            value={selectedAdminId}
                            onChange={(e) => setSelectedAdminId(e.target.value)}
                        >
                            <option value="">-- ເລືອກ Admin --</option>
                            {adminList.map(admin => (
                                <option key={admin._id} value={admin._id}>
                                    {admin.first_name} {admin.last_name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="btn btn-primary btn-sm fw-bold"
                            onClick={handleConfirmSend}
                            disabled={isSaving || !selectedAdminId}
                        >
                            {isSaving
                                ? <span className="spinner-border spinner-border-sm me-1" />
                                : <KTIcon iconName='send' className='fs-5 me-1' />
                            }
                            ຢືນຢັນສົ່ງ
                        </button>
                        <button
                            className="btn btn-light btn-sm"
                            onClick={() => { setShowAdminPicker(false); setSelectedAdminId(''); }}
                            disabled={isSaving}
                        >
                            ຍົກເລີກ
                        </button>
                    </div>
                )}

                {/* ── Action Row ── */}
                <div className="d-flex justify-content-between align-items-center w-100">
                    {/* Status Badge */}
                    <div>
                        {data?.status === 'Sent' && currentUserRole === 'employee' && (
                            <span className="badge badge-light-warning fs-6 py-3 px-4">ກຳລັງລໍຖ້າ Admin ກວດສອບ...</span>
                        )}
                        {(data?.status === 'Approved' || data?.status === 'Invoiced') && (
                            <span className="badge badge-light-success fs-6 py-3 px-4">
                                <KTIcon iconName='check-circle' className='fs-4 me-2' />ອະນຸມັດແລ້ວ
                            </span>
                        )}
                        {data?.status === 'Rejected' && (
                            <span className="badge badge-light-danger fs-6 py-3 px-4">
                                <KTIcon iconName='cross-circle' className='fs-4 me-2' />ຖືກປະຕິເສດ
                            </span>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="d-flex gap-2">
                        <button className="btn btn-light fw-bolder" onClick={handleClose} disabled={isSaving}>
                            ປິດ
                        </button>

                        <button className="btn btn-secondary fw-bolder" onClick={handlePrint} disabled={!data || isSaving}>
                            <KTIcon iconName="printer" className="fs-3 me-2" /> Print Quote
                        </button>

                        {/* Employee: ກົດສົ່ງ → ສະແດງ Picker */}
                        {currentUserRole === 'employee' && data?.status === 'Draft' && !showAdminPicker && (
                            <button className="btn btn-primary fw-bolder" onClick={handleClickSend} disabled={isSaving}>
                                <KTIcon iconName='send' className='fs-3 me-2' />
                                ສົ່ງໃຫ້ Admin ກວດສອບ
                            </button>
                        )}

                        {/* Admin: Approve / Reject */}
                        {currentUserRole === 'admin' && data?.status === 'Sent' && (
                            <>
                                <button className="btn btn-light-danger fw-bolder" onClick={handleReject} disabled={isSaving}>
                                    ປະຕິເສດ
                                </button>
                                <button className="btn btn-success fw-bolder" onClick={handleApproveAndInvoice} disabled={isSaving}>
                                    {isSaving
                                        ? <span className="spinner-border spinner-border-sm me-2" />
                                        : <KTIcon iconName='check-circle' className='fs-3 me-2' />
                                    }
                                    ອະນຸມັດ ແລະ ສ້າງໃບແຈ້ງໜີ້
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default QuotationDetailModal;