import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { KTIcon } from "../../../../_metronic/helpers";

import { customer, Payment as IPaymentType } from './CustomerModuls';
import axios from 'axios';
import moment from 'moment';
import Swal from 'sweetalert2'; 

interface IInvoice {
    _id: string;
    invoiceNumber: string;
    grandTotal: number;
    currency: string;
    issueDate: string;
    status: string;
    customer: string | { _id: string }; 
}

interface IQuotation {
    _id: string;
    quotationId: string;
    grandTotal: number;
    currency: string;
    issueDate: string;
    status: string;
    customer: string | { _id: string };
}

interface IOrderUnion {
    _id: string;
    displayId: string;
    amount: number;
    currency: string;
    date: string;
    status: string;
    type: 'INV' | 'QUO';
}

interface CustomerProfileProps {
    customer: customer;
    onBack?: () => void;
    onUpdateSuccess?: () => void;
}

const apiUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api';

type CustomerReference = string | { _id?: string } | customer | undefined | null;

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onBack, onUpdateSuccess }) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false); 
    const [formData, setFormData] = useState<customer>(customer);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(customer.avatar || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [orders, setOrders] = useState<IOrderUnion[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<IPaymentType[]>([]); 

    // --- Pagination States ---
    const [orderPage, setOrderPage] = useState<number>(1);
    const [paymentPage, setPaymentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const currentOrders = orders.slice((orderPage - 1) * itemsPerPage, orderPage * itemsPerPage);
    const currentPayments = paymentHistory.slice((paymentPage - 1) * itemsPerPage, paymentPage * itemsPerPage);

    const totalOrderPages = Math.ceil(orders.length / itemsPerPage);
    const totalPaymentPages = Math.ceil(paymentHistory.length / itemsPerPage);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const [invRes, quoRes, payRes] = await Promise.allSettled([
                    axios.get<IInvoice[]>(`${apiUrl}/invoice`),
                    axios.get<IQuotation[]>(`${apiUrl}/quotations`),
                    axios.get<IPaymentType[]>(`${apiUrl}/payment/all`) 
                ]);

                const fetchedOrders: IOrderUnion[] = [];
                const fetchedPayments: IPaymentType[] = [];

                const isMatch = (itemCust: CustomerReference): boolean => {
                    if (!itemCust) return false;
                    const id = typeof itemCust === 'object' ? itemCust._id : itemCust;
                    return id === customer._id;
                };

                if (invRes.status === 'fulfilled') {
                    invRes.value.data
                        .filter(inv => isMatch(inv.customer))
                        .forEach(inv => {
                            fetchedOrders.push({
                                _id: inv._id,
                                displayId: inv.invoiceNumber,
                                amount: inv.grandTotal,
                                currency: inv.currency,
                                date: inv.issueDate,
                                status: inv.status,
                                type: 'INV'
                            });
                        });
                }

                if (quoRes.status === 'fulfilled') {
                    quoRes.value.data
                        .filter(quo => isMatch(quo.customer))
                        .forEach(quo => {
                            fetchedOrders.push({
                                _id: quo._id,
                                displayId: quo.quotationId,
                                amount: quo.grandTotal,
                                currency: quo.currency,
                                date: quo.issueDate,
                                status: quo.status,
                                type: 'QUO'
                            });
                        });
                }

                if (payRes.status === 'fulfilled') {
                    const filteredPays = payRes.value.data.filter(pay => isMatch(pay.customer));
                    fetchedPayments.push(...filteredPays);
                }

                setOrders(fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setPaymentHistory(fetchedPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));

            } catch (error) {
                console.error("Fetch Error:", error);
            }
        };

        if (customer._id) fetchHistory();
    }, [customer._id]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            if (parent === 'address') {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        ...(prev.address || {}),
                        [child as keyof customer['address']]: value
                    }
                }));
            } else if (parent === 'contact') {
                setFormData(prev => ({
                    ...prev,
                    contact: {
                        ...(prev.contact || {}),
                        [child as keyof customer['contact']]: value
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name as keyof customer]: value
            }));
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            // 🌟 ປ່ຽນຈາກ alert ມາໃຊ້ SweetAlert
            Swal.fire({
                title: 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ!',
                text: 'ກະລຸນາປ້ອນ ຊື່ ແລະ Email ໃຫ້ຄົບຖ້ວນ.',
                icon: 'warning',
                confirmButtonColor: '#f1416c'
            });
            return;
        }

        setIsLoading(true); 
        try {
            const payload = {
                id:customer._id,
                name: formData.name,
                email: formData.email,
                website: formData.website || '',
                address: formData.address, 
                contact: formData.contact, 
                avatar: selectedFile ? avatarPreview : formData.avatar 
            };

            await axios.put(`${apiUrl}/Customer/${customer._id}`, payload, {
                headers: {
                    'Content-Type': 'application/json' 
                }
            });

            setIsEditing(false);
            if (onUpdateSuccess) onUpdateSuccess();
            
            // 🌟 ແຈ້ງເຕືອນສຳເລັດດ້ວຍ SweetAlert
            Swal.fire({
                title: 'ສຳເລັດ!',
                text: 'ບັນທຶກການແກ້ໄຂຂໍ້ມູນລູກຄ້າສຳເລັດແລ້ວ.',
                icon: 'success',
                confirmButtonColor: '#50cd89',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error: unknown) {
            console.error("Update error:", error);
            let errorMessage = "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            
            // 🌟 ແຈ້ງເຕືອນ Error ດ້ວຍ SweetAlert
            Swal.fire({
                title: 'ຜິດພາດ!',
                text: errorMessage,
                icon: 'error',
                confirmButtonColor: '#f1416c'
            });
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="d-flex flex-column ps-0 py-10">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-5">
                <div className="d-flex align-items-center">
                    <button onClick={onBack} className="btn btn-sm btn-icon btn-light-primary me-3">
                        <KTIcon iconName="arrow-left" className="fs-2" />
                    </button>
                    <span className="text-gray-500 fw-bold fs-7 uppercase">ກັບຄືນລາຍຊື່ລູກຄ້າ</span>
                </div>
            </div>

            <div className="row g-5 g-xxl-8">
                {/* 1. ສ່ວນຂໍ້ມູນລູກຄ້າ (Profile Card) */}
                <div className="col-xl-4">
                    <div className="card card-flush mb-5 mb-xl-8">
                        <div className="card-body pt-15">
                            <div className="d-flex flex-center flex-column mb-5">
                                <div className="position-relative mb-7">
                                    <div className="symbol symbol-100px symbol-circle">
                                        {/* 🌟 ປ່ຽນໃຫ້ Avatar ໃຊ້ຕົວໜັງສືຈາກຊື່ລູກຄ້າແທ້ໆ */}
                                        <img 
                                            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Customer')}&background=random`} 
                                            alt="customer" 
                                            style={{ objectFit: 'cover' }} 
                                        />
                                    </div>
                                    {isEditing && (
                                        <>
                                            <button
                                                className="btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow position-absolute translate-middle start-100 top-100 ms-n3 mt-n3"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                            >
                                                <KTIcon iconName="pencil" className="fs-7" />
                                            </button>
                                            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                                        </>
                                    )}
                                </div>

                                <div className="fs-3 text-gray-800 fw-bold mb-1">{formData.name}</div>
                                <div className="fs-5 fw-semibold text-muted mb-6">{formData.contact?.phone || '-'}</div>
                            </div>

                            <div className="separator separator-dashed my-3"></div>

                            <div className="d-flex flex-stack fs-4 py-3">
                                <div className="fw-bold text-gray-800">ລາຍລະອຽດ</div>
                                <button
                                    onClick={() => {
                                        if (isEditing) {
                                            setFormData(customer);
                                            setAvatarPreview(customer.avatar || null);
                                            setSelectedFile(null);
                                        }
                                        setIsEditing(!isEditing);
                                    }}
                                    className={`btn btn-icon btn-sm ${isEditing ? 'btn-light-danger' : 'btn-light-primary'} w-25px h-25px`}
                                    disabled={isLoading}
                                >
                                    <KTIcon iconName={isEditing ? "cross" : "pencil"} className="fs-5" />
                                </button>
                            </div>

                            <div className="pb-5 fs-6">
                                {isEditing ? (
                                    <div className="d-flex flex-column gap-3">
                                        <div className="fv-row">
                                            <label className="fs-7 fw-bold mb-1 text-muted">Email <span className="text-danger">*</span></label>
                                            <input type="email" name="email" className="form-control form-control-sm" value={formData.email} onChange={handleChange} disabled={isLoading} />
                                        </div>
                                        <div className="fv-row">
                                            <label className="fs-7 fw-bold mb-1 text-muted">ຊື່ຜູ້ຕິດຕໍ່ <span className="text-danger">*</span></label>
                                            <input type="text" name="name" className="form-control form-control-sm" value={formData.name} onChange={handleChange} disabled={isLoading} />
                                        </div>
                                        <div className="fv-row">
                                            <label className="fs-7 fw-bold mb-1 text-muted">Website</label>
                                            <input type="text" name="website" className="form-control form-control-sm" value={formData.website || ''} onChange={handleChange} disabled={isLoading} />
                                        </div>

                                        <div className="row g-2">
                                            <div className="col-12">
                                                <label className="fs-7 fw-bold mb-1 text-muted">ບ້ານ</label>
                                                <input type="text" name="address.village" className="form-control form-control-sm" value={formData.address?.village || ''} onChange={handleChange} disabled={isLoading} />
                                            </div>
                                            <div className="col-6">
                                                <label className="fs-7 fw-bold mb-1 text-muted">ເມືອງ</label>
                                                <input type="text" name="address.district" className="form-control form-control-sm" value={formData.address?.district || ''} onChange={handleChange} disabled={isLoading} />
                                            </div>
                                            <div className="col-6">
                                                <label className="fs-7 fw-bold mb-1 text-muted">ແຂວງ</label>
                                                <input type="text" name="address.province" className="form-control form-control-sm" value={formData.address?.province || ''} onChange={handleChange} disabled={isLoading} />
                                            </div>
                                            <div className="col-12">
                                                <label className="fs-7 fw-bold mb-1 text-muted">ລະຫັດໄປສະນີ</label>
                                                <input type="text" name="address.postCode" className="form-control form-control-sm" value={formData.address?.postCode || ''} onChange={handleChange} disabled={isLoading} />
                                            </div>
                                        </div>

                                        <div className="fv-row">
                                            <label className="fs-7 fw-bold mb-1 text-muted">ເບີໂທຜູ້ຕິດຕໍ່</label>
                                            <input type="text" name="contact.phone" className="form-control form-control-sm" value={formData.contact?.phone || ''} onChange={handleChange} disabled={isLoading} />
                                        </div>
                                        
                                        <button className="btn btn-primary btn-sm mt-3" onClick={handleSave} disabled={isLoading}>
                                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>ກຳລັງບັນທຶກ...</> : "ບັນທຶກ"}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Email</label>
                                            <div className="col-lg-8"><span className="fw-bolder fs-6 text-gray-800">{formData.email}</span></div>
                                        </div>
                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">ຊື່ຜູ້ຕິດຕໍ່</label>
                                            <div className="col-lg-8"><span className="fw-bolder fs-6 text-gray-800">{formData.name}</span></div>
                                        </div>
                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Website</label>
                                            <div className="col-lg-8">
                                                <a href={`https://${formData.website}`} target="_blank" rel="noreferrer" className="fw-bolder fs-6 text-primary text-hover-primary">{formData.website || '-'}</a>
                                            </div>
                                        </div>
                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">ທີ່ຢູ່ບໍລິສັດ</label>
                                            <div className="col-lg-8">
                                                <span className="fw-bolder fs-6 text-gray-800">
                                                    ບ້ານ {formData.address?.village || '-'}, ເມືອງ {formData.address?.district || '-'}, ແຂວງ {formData.address?.province || '-'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">ລະຫັດໄປສະນີ</label>
                                            <div className="col-lg-8">
                                                <span className="fw-bolder fs-6 text-gray-800">{formData.address?.postCode || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">ເບີໂທຜູ້ຕິດຕໍ່</label>
                                            <div className="col-lg-8"><span className="fw-bolder fs-6 text-gray-800">{formData.contact?.phone || '-'}</span></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. ສ່ວນ History */}
                <div className="col-xl-8">
                    <div className="card card-flush mb-5">
                        <div className="card-body d-flex justify-content-between align-items-center flex-wrap">
                            <div className="d-flex flex-column me-5 my-2">
                                <span className="fw-bold text-muted fs-7 text-uppercase">ລາຍການສັ່ງຊື້ທັງໝົດ</span>
                                <span className="fw-bolder fs-2 text-gray-800">{orders.length}</span>
                            </div>
                            <div className="d-flex flex-column me-5 my-2">
                                <span className="fw-bold text-muted fs-7 text-uppercase">ຍອດຊຳລະລວມ</span>
                                <span className="fw-bolder fs-2 text-primary">
                                    {paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()} LAK
                                </span>
                            </div>
                            <div className="d-flex flex-column my-2">
                                <span className="fw-bold text-muted fs-7 text-uppercase">ວັນທີຊຳລະລ່າສຸດ</span>
                                <span className="fw-bolder fs-2 text-gray-800">
                                    {paymentHistory.length > 0 && paymentHistory[0].paymentDate 
                                        ? moment(paymentHistory[0].paymentDate).format('DD/MM/YYYY') 
                                        : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Orders History Table */}
                    <div className="card card-flush mb-5">
                        <div className="card-header align-items-center py-5">
                            <h2 className="card-title fw-bold text-gray-800">ປະຫວັດການສັ່ງຊື້ (Orders History)</h2>
                        </div>
                        <div className="card-body pt-0">
                            <div className="table-responsive" style={{ minHeight: '380px' }}>
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                            <th className="min-w-100px">OrderID / Type</th>
                                            <th className="min-w-150px">ຈຳນວນເງີນ</th>
                                            <th className="min-w-125px">Date</th>
                                            <th className="min-w-100px">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 fw-semibold">
                                        {currentOrders.map((order) => (
                                            <tr key={order._id}>
                                                <td>
                                                    <span className="text-gray-800 fw-bold d-block">{order.displayId}</span>
                                                    <span className={`fs-8 fw-bold ${order.type === 'INV' ? 'text-primary' : 'text-info'}`}>{order.type}</span>
                                                </td>
                                                <td>{order.amount?.toLocaleString()} {order.currency}</td>
                                                <td>{order.date ? moment(order.date).format('DD/MM/YYYY') : '-'}</td>
                                                <td>
                                                    <span className={`badge badge-light-${order.status === 'Paid' || order.status === 'Approved' ? 'success' : 'warning'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted py-5">ບໍ່ມີປະຫວັດການສັ່ງຊື້</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Next/Back Controls */}
                            {orders.length > itemsPerPage && (
                                <div className="d-flex justify-content-between align-items-center mt-5">
                                    <span className="text-muted fs-7">ໜ້າທີ {orderPage} ຈາກ {totalOrderPages}</span>
                                    <div className="d-flex">
                                        <button 
                                            className="btn btn-sm btn-light-primary me-3" 
                                            disabled={orderPage === 1}
                                            onClick={() => setOrderPage(p => p - 1)}
                                        >
                                            <KTIcon iconName="arrow-left" className="fs-3" /> ກ່ອນໜ້າ
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-light-primary" 
                                            disabled={orderPage >= totalOrderPages}
                                            onClick={() => setOrderPage(p => p + 1)}
                                        >
                                            ຖັດໄປ <KTIcon iconName="arrow-right" className="fs-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="card card-flush">
                        <div className="card-header align-items-center py-5">
                            <h2 className="card-title fw-bold text-gray-800">ປະຫວັດການຊຳລະ (Payment History)</h2>
                        </div>
                        <div className="card-body pt-0">
                            <div className="table-responsive" style={{ minHeight: '380px' }}>
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                            <th className="min-w-100px">ເລກທີຊຳລະ</th>
                                            <th className="min-w-125px">ອ້າງອີງບິນ</th>
                                            <th className="min-w-150px">ຈຳນວນເງີນ</th>
                                            <th className="min-w-125px">ວັນທີຊຳລະ</th>
                                            <th className="min-w-100px">ວິທີຊຳລະ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 fw-semibold">
                                        {currentPayments.map((pay) => (
                                            <tr key={pay._id}>
                                                <td><span className="text-gray-800 fw-bold">{pay.paymentNumber}</span></td>
                                                <td>
                                                    <span className="text-gray-600">
                                                        {typeof pay.invoice === 'object' && pay.invoice !== null ? pay.invoice.invoiceNumber : 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-success fw-bold">{(pay.amount || 0).toLocaleString()} {pay.currency || 'LAK'}</span>
                                                </td>
                                                <td>{pay.paymentDate ? moment(pay.paymentDate).format('DD/MM/YYYY') : '-'}</td>
                                                <td><span className="badge badge-light-primary uppercase">{pay.method}</span></td>
                                            </tr>
                                        ))}
                                        {paymentHistory.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center text-muted py-5">ບໍ່ມີປະຫວັດການຊຳລະເງິນ</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Next/Back Controls */}
                            {paymentHistory.length > itemsPerPage && (
                                <div className="d-flex justify-content-between align-items-center mt-5">
                                    <span className="text-muted fs-7">ໜ້າທີ {paymentPage} ຈາກ {totalPaymentPages}</span>
                                    <div className="d-flex">
                                        <button 
                                            className="btn btn-sm btn-light-primary me-3" 
                                            disabled={paymentPage === 1}
                                            onClick={() => setPaymentPage(p => p - 1)}
                                        >
                                            <KTIcon iconName="arrow-left" className="fs-3" /> ກ່ອນໜ້າ
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-light-primary" 
                                            disabled={paymentPage >= totalPaymentPages}
                                            onClick={() => setPaymentPage(p => p + 1)}
                                        >
                                            ຖັດໄປ <KTIcon iconName="arrow-right" className="fs-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;