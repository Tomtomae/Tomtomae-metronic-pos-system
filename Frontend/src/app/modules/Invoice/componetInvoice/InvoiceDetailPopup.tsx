import React, { useState, useEffect } from 'react'
import { KTIcon } from '../../../../_metronic/helpers'
import { InvoiceModel, isCustomerPopulatedInInvoice } from './InvoiceModule'
import { showToast } from '../../../../utils/toastAlert'
import { useAuth } from '../../../../app/modules/auth'
import axios, { AxiosError } from 'axios'

interface Props {
  invoice: InvoiceModel
  show: boolean
  onClose: () => void
  onUpdate: () => void
}

interface PaymentPayload {
  invoiceId: string
  amount: number
  method: 'Cash' | 'Transfer'
  reference: string
  notes: string
}

// 🌟 ກວດສອບຂໍ້ມູນ User (ປ້ອງກັນ any)
interface UserCreator {
  _id: string
  first_name: string
  last_name: string
}

const InvoiceDetailPopup: React.FC<Props> = ({ invoice, show, onClose, onUpdate }) => {
  const { auth } = useAuth()
  const API_URL = import.meta.env.VITE_APP_API_URL

  const [activeTab, setActiveTab] = useState<'detail' | 'payment'>('detail')
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash')
  const [reference, setReference] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // ─── Financial Logic ──────────────────────────
  const formatMoney = (amount: number | undefined): string => {
    const isLak = invoice.currency?.toUpperCase() === 'LAK'
    return (amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: isLak ? 0 : 2,
      maximumFractionDigits: isLak ? 0 : 2,
    })
  }

  const currentTotalPaid: number = invoice.totalPaid || 0
  const currentBalance: number = invoice.balanceDue !== undefined
    ? invoice.balanceDue
    : (invoice.grandTotal - currentTotalPaid)

  const amountToPay: number = Number(paymentAmount) || 0
  const isPaid: boolean = currentBalance <= 0 || invoice.status === 'Paid'
  const sym: string = invoice.currency === 'USD' ? '$' : invoice.currency === 'THB' ? '฿' : '₭'

  // ດຶງຊື່ຜູ້ອອກບິນ (Employee)
  const creator = invoice.createdBy as unknown as UserCreator | undefined
  const issuedByName = creator ? `${creator.first_name} ${creator.last_name}` : 'ບໍ່ລະບຸ'

  useEffect(() => {
    if (show) {
      setActiveTab('detail')
      setPaymentAmount('')
      setReference('')
    }
  }, [show, invoice._id])

  if (!show) return null

  const handlePayment = async (): Promise<void> => {
    if (amountToPay <= 0) {
      showToast('warning', 'ກະລຸນາລະບຸຈຳນວນເງິນຊຳລະ')
      return
    }

    const payload: PaymentPayload = {
      invoiceId: invoice._id || '',
      amount: amountToPay,
      method: paymentMethod,
      reference: reference,
      notes: `ຊຳລະບິນ ${invoice.invoiceNumber} ຜ່ານລະບົບ Dashboard`,
    }

    try {
      setIsSubmitting(true)
      await axios.post(`${API_URL}/payment`, payload, {
        headers: { Authorization: `Bearer ${auth?.api_token}` },
      })
      showToast('success', `ບັນທຶກການຊຳລະ ${formatMoney(amountToPay)} ${sym} ສຳເລັດ`)
      onUpdate()
      onClose()
    } catch (error: unknown) {
      let errorMsg = 'ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່'
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>
        errorMsg = axiosError.response?.data?.message || error.message
      }
      showToast('error', errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className='modal-backdrop fade show' style={{ opacity: 0.5 }}></div>
      <div className='modal fade show d-block' tabIndex={-1}>
        <div className='modal-dialog modal-dialog-centered mw-625px'>
          <div className='modal-content border-0 shadow-lg' style={{ borderRadius: '10px', overflow: 'hidden' }}>

            {/* ── Section 1: Header ── */}
            <div className='px-8 py-5 d-flex align-items-center justify-content-between'
              style={{ background: 'linear-gradient(to right, #31c268, #389c8f)' }}>
              <div className='d-flex align-items-center'>
                <div className='me-4 bg-white bg-opacity-10 p-2 rounded'>
                  <KTIcon iconName='abstract-41' className='text-white fs-1' />
                </div>
                <div>
                  <h3 className='text-white fw-boldest fs-3 mb-0' style={{ letterSpacing: '0.5px' }}>
                    {invoice.invoiceNumber}
                  </h3>
                  <span className='text-dark fs-9 fw-bold text-uppercase'>
                    ລູກຄ້າ: {isCustomerPopulatedInInvoice(invoice.customer) ? invoice.customer.name : 'ບໍ່ລະບຸຊື່'}
                  </span>
                </div>
              </div>
              <button className='btn btn-icon btn-sm btn-active-light-primary' onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)' }}>
                <KTIcon iconName='cross' className='fs-2 text-gray-400' />
              </button>
            </div>

            {/* ── Section 2: Summary Bar ── */}
            <div className='d-flex bg-light-soft border-bottom'>
              <div className='flex-fill p-5 text-center border-end'>
                <div className='text-muted fs-9 fw-bold text-uppercase mb-1'>ຍອດລວມທັງໝົດ</div>
                <div className='fs-4 fw-bold text-gray-800'>{formatMoney(invoice.grandTotal)} <small className='fs-9'>{sym}</small></div>
              </div>
              <div className='flex-fill p-5 text-center border-end bg-white bg-opacity-40'>
                <div className='text-success fs-9 fw-bold text-uppercase mb-1'>ຊຳລະແລ້ວ</div>
                <div className='fs-4 fw-bold text-success'>{formatMoney(currentTotalPaid)} <small className='fs-9'>{sym}</small></div>
              </div>
              <div className='flex-fill p-5 text-center' style={{ background: 'rgba(241, 65, 108, 0.03)' }}>
                <div className='text-danger fs-9 fw-bold text-uppercase mb-1'>ຍອດຍັງຄ້າງ</div>
                <div className='fs-4 fw-boldest text-danger'>{formatMoney(currentBalance)} <small className='fs-9'>{sym}</small></div>
              </div>
            </div>

            {/* ── Section 3: Tabs Navigation ── */}
            <div className='px-8 bg-white border-bottom'>
              <ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-6 fw-bold'>
                <li className='nav-item'>
                  <span className={`nav-link py-4 cursor-pointer ${activeTab === 'detail' ? 'active text-primary border-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('detail')}>ລາຍລະອຽດທົ່ວໄປ</span>
                </li>
                <li className='nav-item'>
                  <span className={`nav-link py-4 cursor-pointer ${activeTab === 'payment' ? 'active text-primary border-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('payment')}>ບັນທຶກການຊຳລະ</span>
                </li>
              </ul>
            </div>

            {/* ── Section 4: Dynamic Content ── */}
            <div className='modal-body p-8 bg-white'>
              {activeTab === 'detail' ? (
                <div className='scroll-y mh-350px px-2'>
                  
                  {/* Issued By & Dates */}
                  <div className='row g-5 mb-6 p-4 bg-light rounded-2'>
                    <div className='col-4 d-flex flex-column'>
                      <span className='fs-9 text-muted fw-bold text-uppercase'>ຜູ້ອອກບິນ (Employee)</span>
                      <span className='fw-bold text-primary'>{issuedByName}</span>
                    </div>
                    <div className='col-4 d-flex flex-column text-center border-start'>
                      <span className='fs-9 text-muted fw-bold text-uppercase'>ວັນທີອອກບິນ</span>
                      <span className='fw-bold text-gray-800'>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('lo-LA') : '-'}</span>
                    </div>
                    <div className='col-4 d-flex flex-column text-end border-start'>
                      <span className='fs-9 text-muted fw-bold text-uppercase'>ວັນຄົບກຳນົດ</span>
                      <span className='fw-bold text-danger'>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('lo-LA') : '-'}</span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className='table-responsive border rounded'>
                    <table className='table align-middle table-row-gray-200 fs-7 gy-4 mb-0'>
                      <thead className='bg-light-dark bg-opacity-5'>
                        <tr className='text-start text-muted fw-bold text-uppercase gs-0'>
                          <th className='ps-4 min-w-200px'>ລາຍການ</th>
                          <th className='text-center'>ຈຳນວນ</th>
                          <th className='text-end pe-4'>ລາຄາລວມ ({invoice.currency})</th>
                        </tr>
                      </thead>
                      <tbody className='text-gray-700 fw-semibold'>
                        {invoice.lineItems?.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? '' : 'bg-light-soft bg-opacity-30'}>
                            <td className='ps-4'>
                              <div className='text-gray-800 fw-bold'>{item.name}</div>
                            </td>
                            <td className='text-center'>{item.quantity} {item.unit}</td>
                            <td className='text-end pe-4 fw-bold text-dark'>{formatMoney(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className='px-2'>
                  {isPaid ? (
                    <div className='text-center py-10 rounded-3 border border-dashed border-success bg-light-success bg-opacity-50'>
                      <KTIcon iconName='verify' className='fs-5x text-success mb-4' />
                      <h3 className='fw-boldest text-success mb-1 text-uppercase'>ຊຳລະຄົບຖ້ວນແລ້ວ</h3>
                      <p className='text-gray-600 fs-7 mb-0'>ບິນນີ້ບໍ່ມີຍອດຄ້າງຊຳລະໃນລະບົບ.</p>
                    </div>
                  ) : (
                    <div className='row g-6'>
                      <div className='col-12'>
                        <label className='form-label fw-bolder fs-8 text-uppercase text-gray-600'>ວິທີການຊຳລະ</label>
                        <div className='d-flex gap-3'>
                          <button className={`btn btn-sm flex-grow-1 fw-bold border ${paymentMethod === 'Cash' ? 'btn-primary' : 'btn-light'}`}
                            onClick={() => setPaymentMethod('Cash')}>💵 ເງິນສົດ</button>
                          <button className={`btn btn-sm flex-grow-1 fw-bold border ${paymentMethod === 'Transfer' ? 'btn-primary' : 'btn-light'}`}
                            onClick={() => setPaymentMethod('Transfer')}>🏦 ເງິນໂອນ</button>
                        </div>
                      </div>
                      <div className='col-12'>
                        <div className='d-flex justify-content-between align-items-center mb-2'>
                          <label className='form-label fw-bolder fs-8 text-uppercase text-gray-600 mb-0'>ຈຳນວນເງິນຊຳລະ</label>
                          <span className='badge badge-light-primary cursor-pointer fw-bold' onClick={() => setPaymentAmount(currentBalance.toString())}>ຊຳລະເຕັມຈຳນວນ</span>
                        </div>
                        <div className='input-group input-group-solid border rounded'>
                          <input type='number' className='form-control form-control-lg fw-boldest fs-1 text-center text-primary'
                            value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder='0.00' />
                          <span className='input-group-text bg-light text-gray-500 fw-bold'>{invoice.currency}</span>
                        </div>
                      </div>
                      <div className='col-12'>
                        <label className='form-label fw-bolder fs-8 text-uppercase text-gray-600'>ໝາຍເຫດ / ເລກອ້າງອີງ</label>
                        <input type='text' className='form-control form-control-solid'
                          value={reference} onChange={(e) => setReference(e.target.value)} placeholder='ຕົວຢ່າງ: ເລກທີໃບໂອນ, ເລກທີບິນ...' />
                      </div>
                      <div className='col-12'>
                        <button className='btn btn-primary w-100 py-4 fs-6 fw-boldest shadow-sm'
                          onClick={handlePayment} disabled={isSubmitting || amountToPay <= 0}>
                          {isSubmitting ? <span className='spinner-border spinner-border-sm me-2'></span> : 'ຢືນຢັນການຊຳລະ'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 5: Footer ── */}
            <div className='modal-footer border-0 py-4 px-8 bg-light-soft'>
              <button type='button' className='btn btn-sm btn-secondary fw-bold' onClick={onClose}>ປິດໜ້າຕ່າງ</button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default InvoiceDetailPopup