import React, { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react'
import { KTIcon } from '../../../../_metronic/helpers'
import { 
  PaymentModule, 
  Customer, 
  InvoiceReference, 
  isInvoicePopulated 
} from './Payment'
import { MenuComponent } from '../../../../_metronic/assets/ts/components'
import ReceiptDetailModal from './ReceiptDetail' 
import axios, { AxiosError } from 'axios'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const API_URL = import.meta.env.VITE_APP_API_URL
export const get_Payment = `${API_URL}/payment/all`

const PaidPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentModule[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>('All')
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage: number = 10

  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentModule | null>(null)

  // --- 1. ຟັງຊັນດຶງຂໍ້ມູນ ---
  const fetchPayments = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await axios.get<PaymentModule[]>(get_Payment)
      setPayments(Array.isArray(response.data) ? response.data : [])
    } catch (error: unknown) {
      const axiosError = error as AxiosError
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'ບໍ່ສາມາດໂຫຼດຂໍ້ມູນການຊຳລະໄດ້: ' + axiosError.message,
      })
    } finally {
      setLoading(false)
      setTimeout(() => MenuComponent.reinitialization(), 300)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // --- 2. ຄິດໄລ່ຍອດລວມແຍກຕາມສະກຸນເງິນ (Summary Logic) ---
  const totalsByCurrency = useMemo(() => {
    return payments.reduce((acc, curr) => {
      const currency = curr.currency || 'LAK'
      const amount = curr.amount || 0
      acc[currency] = (acc[currency] || 0) + amount
      return acc
    }, {} as Record<string, number>)
  }, [payments])

 const filteredReceipts = useMemo((): PaymentModule[] => {
    return payments.filter((rc) => {
      const cust = rc.customer && typeof rc.customer === 'object' ? (rc.customer as Customer) : null
      const inv = rc.invoice && isInvoicePopulated(rc.invoice) ? (rc.invoice as InvoiceReference) : null

      // 🌟 [เพิ่มใหม่] เงื่อนไขการเช็คว่า "จ่ายเต็มจำนวน" หรือไม่
      // ดึงยอดเต็มบิลมาตรวจสอบ
      const fullTotal = rc.invoiceTotalSnapshot || inv?.grandTotal || rc.amount || 0;
      
      // ถ้ายอดที่จ่ายมา (rc.amount) น้อยกว่ายอดเต็มบิล (fullTotal) 
      // แปลว่าจ่ายแค่บางส่วน -> ให้ return false เพื่อ "ซ่อน" รายการนี้ออกไป
      if (rc.amount < fullTotal) {
        return false; 
      }

      const customerName = cust?.name || ''
      const paymentNumber = rc.paymentNumber || ''
      const invoiceNo = inv?.invoiceNumber || ''

      const matchesSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesMethod = activeTab === 'All' || rc.method === activeTab

      const rcDate = new Date(rc.paymentDate).setHours(0, 0, 0, 0)
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null
      const matchesDate = (!start || rcDate >= start) && (!end || rcDate <= end)

      return matchesSearch && matchesMethod && matchesDate
    })
  }, [payments, searchTerm, activeTab, startDate, endDate])

  const totalPages: number = Math.ceil(filteredReceipts.length / itemsPerPage)
  
  // ຍ້າຍການປະກາດຕົວປ່ຽນມາໄວ້ໃນນີ້ ເພື່ອໃຫ້ສາມາດໃຊ້ງານໄດ້ທັງໃນ useMemo ແລະ UI ດ້ານລຸ່ມ
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

  const paginatedData: PaymentModule[] = useMemo(() => {
    return filteredReceipts.slice(indexOfFirstItem, indexOfLastItem)
  }, [filteredReceipts, indexOfFirstItem, indexOfLastItem])

  const resetFilters = (): void => {
    setSearchTerm('')
    setActiveTab('All')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const handleOpenReceipt = (payment: PaymentModule): void => {
    setSelectedPayment(payment)
    setShowModal(true)
  }

  const formatCurrency = (amount: number, currency: string): string => {
    const isLak = currency.toUpperCase() === 'LAK'
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: isLak ? 0 : 2,
      maximumFractionDigits: isLak ? 0 : 2,
    })
  }

  return (
    <div className='d-flex flex-column gap-5'>
      {/* 📊 Summary Section */}
      <div className='row g-5'>
        {Object.entries(totalsByCurrency).map(([curr, total]) => (
          <div className='col-md-4' key={curr}>
            <div className='card card-flush h-md-100 bg-light-primary border-primary border-dashed'>
              <div className='card-body d-flex flex-column justify-content-center px-9 py-6'>
                <span className='fs-4 fw-bold text-gray-800 mb-1'>ຍອດຮັບທັງໝົດ ({curr})</span>
                <span className='fs-2hx fw-bolder text-primary'>{formatCurrency(total, curr)} {curr}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='card card-flush'>
        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <KTIcon iconName='magnifier' className='fs-1 position-absolute ms-4' />
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='ຄົ້ນຫາເລກທີ/ລູກຄ້າ/INV'
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          <div className='card-toolbar'>
            <button type='button' className='btn btn-light-primary fw-bold me-3' data-kt-menu-trigger='click' data-kt-menu-placement='bottom-end'>
              <KTIcon iconName='filter' className='fs-2' /> ກັ່ນກອງ
            </button>

            <div className='menu menu-sub menu-sub-dropdown w-300px w-md-325px' data-kt-menu='true'>
              <div className='px-7 py-5'><div className='fs-5 text-dark fw-bolder'>ຕົວເລືອກເພີ່ມເຕີມ</div></div>
              <div className='separator border-gray-200'></div>
              <div className='px-7 py-5'>
                <div className='mb-5'>
                  <label className='form-label fw-bold'>ຊ່ວງວັນທີ:</label>
                  <div className='d-flex gap-2'>
                    <input type='date' className='form-control form-control-solid' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type='date' className='form-control form-control-solid' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className='d-flex justify-content-end'>
                  <button type='button' className='btn btn-sm btn-light me-2' onClick={resetFilters}>ລ້າງຄ່າ</button>
                  <button type='button' className='btn btn-sm btn-primary' data-kt-menu-dismiss='true'>ຕົກລົງ</button>
                </div>
              </div>
            </div>

            <button className='btn btn-primary fw-bold' onClick={fetchPayments} disabled={loading}>
              <KTIcon iconName='arrows-circle' className={`fs-2 ${loading ? 'spinner' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className='card-body pt-0'>
          {/* 📑 Tab Selection */}
          <ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bold mb-5'>
            {['All', 'Cash', 'Bank Transfer', 'Mobile Banking'].map((tab) => (
              <li className='nav-item' key={tab}>
                <a
                  className={`nav-link text-active-primary py-4 me-10 cursor-pointer ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                >
                  {tab === 'All' ? 'ທັງໝົດ' : tab}
                </a>
              </li>
            ))}
          </ul>

          <div className='table-responsive'>
            {loading ? (
              <div className='d-flex flex-column align-items-center py-10'>
                <div className='spinner-border text-primary' role='status'></div>
                <span className='text-muted mt-2'>ກຳລັງໂຫຼດ...</span>
              </div>
            ) : (
              <>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th className='min-w-100px ps-4'>ເລກທີໃບຮັບ</th>
                      <th className='min-w-100px'>ອ້າງອີງ INV</th>
                      <th className='min-w-150px'>ລູກຄ້າ</th>
                      <th className='min-w-100px'>ວັນທີຊຳລະ</th>
                      <th className='min-w-120px text-end'>ຍອດເຕັມບິນ</th>
                      <th className='min-w-120px text-end'>ຈ່າຍຄັ້ງນີ້</th>
                      <th className='min-w-100px text-center'>ຊ່ອງທາງ</th>
                      <th className='text-end min-w-70px pe-4'>Action</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((rc, index) => {
                        const inv = rc.invoice && typeof rc.invoice === 'object' ? (rc.invoice as InvoiceReference) : null
                        const cust = rc.customer && typeof rc.customer === 'object' ? (rc.customer as Customer) : null

                        return (
                          <tr key={rc._id || index}>
                            <td className='text-dark fw-bold ps-4'>{rc.paymentNumber}</td>
                            
                            {/* ແກ້ໄຂໃຫ້ຮອງຮັບກໍລະນີບໍ່ມີ Invoice (Direct Payment) */}
                            <td className='text-primary fw-bold'>
                              {inv?.invoiceNumber ? inv.invoiceNumber : <span className="badge badge-light-info">ຊຳລະກົງ (ບໍ່ມີບິນ)</span>}
                            </td>
                            
                            <td>{cust?.name || 'Unknown'}</td>
                            <td>{rc.paymentDate ? new Date(rc.paymentDate).toLocaleDateString('lo-LA') : '-'}</td>
                            
                            <td className='text-end text-muted'>
                              {/* ດຶງຍອດເຕັມບິນ ຖ້າບໍ່ມີ Invoice ກໍເອົາຍອດ snapshot ມາແທນ */}
                              {formatCurrency(rc.invoiceTotalSnapshot || inv?.grandTotal || rc.amount || 0, rc.currency || 'LAK')} {rc.currency}
                            </td>
                            
                            <td className='text-end text-dark fw-bolder'>
                              {formatCurrency(rc.amount || 0, rc.currency || 'LAK')} {rc.currency}
                            </td>
                            <td className='text-center'>
                              <span className={`badge ${rc.method === 'Cash' ? 'badge-light-success' : 'badge-light-primary'} text-uppercase`}>
                                {rc.method}
                              </span>
                            </td>
                            <td className='text-end pe-4'>
                              <button className='btn btn-sm btn-icon btn-bg-light btn-active-color-primary' onClick={() => handleOpenReceipt(rc)}>
                                <KTIcon iconName='eye' className='fs-2' />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr><td colSpan={8} className='text-center py-10 text-muted'>ບໍ່ພົບຂໍ້ມູນການຊຳລະ</td></tr>
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className='d-flex justify-content-between align-items-center pt-5'>
                    <div className='text-gray-600 fs-7 fw-bold'>
                      ສະແດງ {indexOfFirstItem + 1} ຫາ {Math.min(indexOfLastItem, filteredReceipts.length)} ຈາກ {filteredReceipts.length} ລາຍການ
                    </div>
                    <ul className='pagination'>
                      <li className={`page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className='page-link' onClick={() => setCurrentPage(currentPage - 1)}><i className='previous'></i></button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                          <button className='page-link' onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                        </li>
                      ))}
                      <li className={`page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className='page-link' onClick={() => setCurrentPage(currentPage + 1)}><i className='next'></i></button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <ReceiptDetailModal show={showModal} handleClose={() => setShowModal(false)} payment={selectedPayment} />
      </div>
    </div>
  )
}

export default PaidPage