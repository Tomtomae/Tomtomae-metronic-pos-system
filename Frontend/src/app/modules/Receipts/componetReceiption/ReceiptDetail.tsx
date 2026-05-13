import React, { useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { KTIcon } from '../../../../_metronic/helpers';
import {
    PaymentModule,
    Customer,
    InvoiceReference,
    isCustomerPopulated,
    isInvoicePopulated
} from './Payment';

// 🌟 Import Global Toast
import { showToast } from '../../../../utils/toastAlert'; 

interface Props {
    show: boolean;
    handleClose: () => void;
    payment: PaymentModule | null;
}

const ReceiptDetail: React.FC<Props> = ({ show, handleClose, payment }) => {

    const handlePrint = useCallback(() => {
        // 🌟 ໃຊ້ showToast ຈາກ Utility
        showToast('info', `ກຳລັງເປີດໜ້າຕ່າງພິມ ສຳລັບໃບຮັບເງິນ ${payment?.paymentNumber}...`);
        setTimeout(() => {
            window.print();
            showToast('success', `ພິມໃບຮັບເງິນ ${payment?.paymentNumber} ສຳເລັດ!`);
        }, 500);
    }, [payment?.paymentNumber]);

    if (!payment) return null;

    const customer: Customer | null = isCustomerPopulated(payment.customer) ? payment.customer : null;
    const invoice: InvoiceReference | null = isInvoicePopulated(payment.invoice) ? payment.invoice : null;

    const invoiceTotal: number = payment.invoiceTotalSnapshot || invoice?.grandTotal || 0;
    const paidAmount: number = payment.amount || 0;
    const remainingBalance: number = Math.max(0, invoiceTotal - paidAmount);

    const paymentDateObj = new Date(payment.paymentDate);

    const minRows: number = 12;
    const lineItems = invoice?.lineItems || [];
    const itemsCount: number = lineItems.length;
    const actualItemsCount: number = itemsCount > 0 ? itemsCount : 1;
    const emptyRowsCount: number = Math.max(0, minRows - actualItemsCount);

    const formatCurrency = (amount: number, currencyType: string): string => {
        const isLak = currencyType.toUpperCase() === 'LAK';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: isLak ? 0 : 2,
            maximumFractionDigits: isLak ? 0 : 2,
        }).format(amount);
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size='xl'
            centered
            backdrop='static'
            contentClassName="rounded-0 border-0 shadow-lg"
        >
            {/* ... CSS Styles ຂອງທ່ານຍັງຄືເກົ່າທັງໝົດ ຂ້ອຍບໍ່ໄດ້ຕັດອອກ ... */}
            <style>{`
                .quote-wrapper { font-family: 'Phetsarath OT', 'Arial', 'Tahoma', sans-serif; color: #000; font-size: 12px; background: #fff; }
                .quote-wrapper * { box-sizing: border-box; }
                .color-primary-bg { background-color: #198754 !important; color: #fff !important; }
                .color-light-bg { background-color: #E8F5E9 !important; }
                .color-light-title { color: #198754 !important; }
                .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                .logo-box { width: 60px; height: 60px; background-color: #198754; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; }
                .meta-table { border-collapse: collapse; width: 220px; float: right; margin-top: 10px; }
                .meta-table td { padding: 3px 5px; font-size: 11px; }
                .meta-table td.label { text-align: right; padding-right: 10px; width: 100px; font-weight: bold; }
                .meta-table td.value { border: 1px solid #000; text-align: center; }
                .section-title { font-size: 13px; font-weight: bold; padding: 4px 6px; margin-bottom: 5px; width: 45%; }
                .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #000; }
                .items-table th { padding: 8px; text-align: center; font-weight: bold; font-size: 11px; border-bottom: 1px solid #000; }
                .items-table th:first-child { text-align: left; }
                .items-table td { border-left: 1px solid #000; border-right: 1px solid #000; padding: 8px; vertical-align: top; }
                .items-table tr.striped td { background-color: #F9FDF9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .footer-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; }
                .terms-box { width: 55%; border: 1px solid #000; }
                .terms-title { font-size: 13px; font-weight: bold; padding: 4px 6px; text-align: center; }
                .terms-content { padding: 15px; line-height: 1.6; display: flex; justify-content: space-around; text-align: center; }
                .totals-table { width: 42%; border-collapse: collapse; }
                .totals-table td { padding: 6px; }
                .totals-table td.label { text-align: right; font-weight: bold; }
                .totals-table td.currency { width: 20px; border-left: 1px solid transparent; text-align: left; }
                .totals-table td.value { border: 1px solid #000; text-align: right; width: 120px; font-weight: bold; }
                .totals-table tr.grand-total td { font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; font-size: 13px; }
                .quote-footer-text { text-align: center; margin-top: 40px; line-height: 1.4; padding-bottom: 20px; }

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

            <div className='modal-body p-0'>
                <div className="p-10 p-lg-15 quote-wrapper">

                    {/* ---------------- HEADER ---------------- */}
                    <div className="header-top">
                        <div className="d-flex">
                            <div className="logo-box">LOGO</div>
                            <div>
                                <div style={{ fontSize: '24px', color: '#198754', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Community Co., Ltd
                                </div>
                                <div style={{ lineHeight: '1.4' }}>
                                    Asean Road, Sibounheuang Village<br />
                                    Chanthabouly District, Vientiane, Laos<br />
                                    Website: www.community.la<br />
                                    Phone: +856 20 5555 5555
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="color-light-title" style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px' }}>
                                RECEIPT
                            </div>
                            <table className="meta-table">
                                <tbody>
                                    <tr>
                                        <td className="label">DATE:</td>
                                        <td className="value">{paymentDateObj.toLocaleDateString('en-GB')}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">RECEIPT #:</td>
                                        <td className="value">{payment.paymentNumber}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">INVOICE #:</td>
                                        <td className="value">{invoice?.invoiceNumber || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">METHOD:</td>
                                        <td className="value text-uppercase">{payment.method}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ---------------- CUSTOMER INFO ---------------- */}
                    <div>
                        <div className="section-title color-primary-bg">RECEIVED FROM (ໄດ້ຮັບເງິນຈາກ)</div>
                        <div style={{ lineHeight: '1.5', display: 'flex', justifyContent: 'space-between', padding: '5px' }}>
                            <div>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {customer?.name || 'ລູກຄ້າທົ່ວໄປ (General Customer)'}
                                </span><br />
                                {customer?.contact?.name && (
                                    <span><b>ຜູ້ຕິດຕໍ່:</b> {customer.contact.name}<br /></span>
                                )}
                                {customer?.address && (
                                    <span><b>ທີ່ຢູ່:</b> {customer.address.district}, {customer.address.province}<br /></span>
                                )}
                                {customer?.contact?.phone && (
                                    <span><b>ເບີໂທ:</b> {customer.contact.phone}</span>
                                )}
                            </div>
                            <div style={{ textAlign: 'right', color: '#333' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                                    ອ້າງອີງຈາກໃບແຈ້ງໜີ້ (Ref. Invoice):{' '}
                                    <span style={{ color: '#198754' }}>{invoice?.invoiceNumber || 'N/A'}</span>
                                </div>
                                {payment.reference && (
                                    <div style={{ fontStyle: 'italic', color: '#555' }}>Ref: {payment.reference}</div>
                                )}
                                {payment.notes && (
                                    <div style={{ fontStyle: 'italic', color: '#555' }}>Note: {payment.notes}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ---------------- ITEMS TABLE ---------------- */}
                    <table className="items-table">
                        <thead>
                            <tr className="color-primary-bg">
                                <th style={{ width: '45%' }}>DESCRIPTION (ລາຍການສິນຄ້າ)</th>
                                <th style={{ width: '15%' }}>UNIT PRICE</th>
                                <th style={{ width: '10%' }}>QTY</th>
                                <th style={{ width: '10%' }}>TAX RATE</th>
                                <th style={{ width: '20%' }}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody style={{ borderBottom: '1px solid #000' }}>
                            {itemsCount > 0 ? (
                                lineItems.map((item, index) => (
                                    <tr key={`item-${index}`} className={index % 2 !== 0 ? 'striped' : ''}>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>
                                                {item.name}{' '}
                                                {item.type && (
                                                    <span style={{ fontWeight: 'normal', color: '#666' }}>({item.type})</span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                                                    {item.description}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.price, payment.currency)}</td>
                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'center' }}>{item.taxRate && item.taxRate > 0 ? `${item.taxRate}%` : '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount, payment.currency)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="striped">
                                    <td style={{ fontWeight: 'bold' }}>
                                        ຊຳລະຄ່າບໍລິການ/ສິນຄ້າ ຕາມໃບແຈ້ງໜີ້ເລກທີ {invoice?.invoiceNumber || 'N/A'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>-</td>
                                    <td style={{ textAlign: 'center' }}>-</td>
                                    <td style={{ textAlign: 'center' }}>-</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {formatCurrency(paidAmount, payment.currency)}
                                    </td>
                                </tr>
                            )}
                            {[...Array(emptyRowsCount)].map((_, i) => {
                                const actualIndex: number = actualItemsCount + i;
                                return (
                                    <tr key={`empty-${i}`} className={actualIndex % 2 !== 0 ? 'striped' : ''}>
                                        <td style={{ color: 'transparent' }}>-</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td style={{ textAlign: 'right' }}>-</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* ---------------- FOOTER & TOTALS ---------------- */}
                    <div className="footer-grid">
                        <div className="terms-box">
                            <div className="terms-title color-primary-bg">ລາຍເຊັນຢັ້ງຢືນ (SIGNATURES)</div>
                            <div className="terms-content">
                                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', width: '100%' }}>
                                    <div>
                                        <div style={{ marginBottom: '50px' }}>ຜູ້ຮັບເງິນ (Received By)</div>
                                        <div style={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto' }}></div>
                                        <div style={{ marginTop: '5px', fontSize: '11px' }}>ວັນທີ: ____/____/______</div>
                                    </div>
                                    <div>
                                        <div style={{ marginBottom: '50px' }}>ຜູ້ຈ່າຍເງິນ (Paid By)</div>
                                        <div style={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto' }}></div>
                                        <div style={{ marginTop: '5px', fontSize: '11px' }}>ວັນທີ: ____/____/______</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <table className="totals-table">
                            <tbody>
                                <tr>
                                    <td className="label">ຍອດເຕັມບິນ (Invoice Total)</td>
                                    <td className="currency">{payment.currency || '₭'}</td>
                                    <td className="value">{formatCurrency(invoiceTotal, payment.currency)}</td>
                                </tr>
                                <tr className="grand-total color-light-bg">
                                    <td className="label">ຍອດຊຳລະຄັ້ງນີ້ (Paid Amount)</td>
                                    <td className="currency">{payment.currency || '₭'}</td>
                                    <td className="value color-light-title">{formatCurrency(paidAmount, payment.currency)}</td>
                                </tr>
                                <tr>
                                    <td className="label" style={{ color: '#dc3545' }}>ຍອດຄົງເຫຼືອ (Remaining)</td>
                                    <td className="currency">{payment.currency || '₭'}</td>
                                    <td className="value" style={{ borderBottom: '1px solid #000', color: '#dc3545' }}>
                                        {formatCurrency(remainingBalance, payment.currency)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="quote-footer-text">
                        <b style={{ fontStyle: 'italic', fontSize: '13px', display: 'block', marginTop: '5px' }}>
                            ຂໍຂອບໃຈທີ່ໃຊ້ບໍລິການ! (Thank You For Your Business!)
                        </b>
                    </div>
                </div>
            </div>

            <div className="modal-footer bg-light border-0 d-print-none">
                <button className="btn btn-light fw-bolder" onClick={handleClose}>
                    ປິດ (Close)
                </button>
                <button className="btn btn-primary fw-bolder" onClick={handlePrint}>
                    <KTIcon iconName="printer" className="fs-3 me-2" /> ພິມໃບຮັບເງິນ (Print Receipt)
                </button>
            </div>
        </Modal>
    );
};

export default ReceiptDetail;