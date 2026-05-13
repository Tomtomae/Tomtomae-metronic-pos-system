import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface CustomerInfo {
  name: string
}

interface HistoryItem {
  _id: string
  invoiceNumber?: string
  paymentNumber?: string
  quotationId?: string
  customer?: CustomerInfo
  grandTotal?: number
  amount?: number
  currency?: string
  status: string
  createdAt: string
  issueDate?: string
  paymentDate?: string
  type?: string
}

type Props = {
  className: string
}

const API_URL = import.meta.env.VITE_APP_API_URL
const REFRESH_INTERVAL_MS = 5000

const animationStyles = `
  @keyframes slideFadeIn {
    from { opacity: 0; transform: translateY(-15px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .row-animate {
    opacity: 0;
    animation: slideFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const TablesWidget9: React.FC<Props> = ({ className }) => {
  const [data,    setData]    = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchHistory = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      setError(null)

      const [invRes, quoRes, payRes] = await Promise.allSettled([
        axios.get<HistoryItem[]>(`${API_URL}/invoice`),
        axios.get<HistoryItem[]>(`${API_URL}/quotations`),
        axios.get<HistoryItem[]>(`${API_URL}/payment/all`),
      ])

      let allData: HistoryItem[] = []

      if (invRes.status === 'fulfilled' && invRes.value.data) {
        const invoices = invRes.value.data.map(item => ({ ...item, type: 'Invoice' }))
        allData = [...allData, ...invoices]
      }

      if (quoRes.status === 'fulfilled' && quoRes.value.data) {
        const quotations = quoRes.value.data.map(item => ({ ...item, type: 'Quotation' }))
        allData = [...allData, ...quotations]
      }

      if (payRes.status === 'fulfilled' && payRes.value.data) {
        const payments = payRes.value.data.map(item => ({
          ...item,
          type: 'Payment',
          issueDate: item.paymentDate,
        }))
        allData = [...allData, ...payments]
      }

      const sortedData = allData.sort((a, b) => {
        const dateA = new Date(a.issueDate || a.createdAt || 0).getTime()
        const dateB = new Date(b.issueDate || b.createdAt || 0).getTime()
        return dateB - dateA
      })

      setData(sortedData.slice(0, 5))

    } catch (err) {
      console.error('TablesWidget9 fetch error:', err)
      setError('ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້ໃນຂະນະນີ້')
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(false)
    const interval = setInterval(() => fetchHistory(true), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchHistory])

  // ── Helpers ─────────────────────────────────────────────────
  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase() || ''
    switch (s) {
      case 'paid':
      case 'approved':
      case 'completed':
        return { label: 'ສຳເລັດແລ້ວ', color: 'badge-light-success' }
      case 'pending':
      case 'draft':
        return { label: 'ລໍຖ້າດຳເນີນການ', color: 'badge-light-warning' }
      case 'declined':
      case 'rejected':
      case 'cancelled':
        return { label: 'ຍົກເລີກແລ້ວ', color: 'badge-light-danger' }
      case 'partial':
        return { label: 'ຊຳລະບາງສ່ວນ', color: 'badge-light-primary' }
      case 'invoiced':
        return { label: 'ອອກບິນແລ້ວ', color: 'badge-light-info' }
      default:
        return { label: status || 'ບໍ່ລະບຸ', color: 'badge-light-secondary' }
    }
  }

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'Quotation': return 'text-primary'
      case 'Invoice':   return 'text-warning'
      case 'Payment':   return 'text-success'
      default:          return 'text-muted'
    }
  }

  // ── JSX ─────────────────────────────────────────────────────
  return (
    <>
      <style>{animationStyles}</style>

      <div className={`card ${className}`}>
        <div className='card-header border-0 pt-5'>
          <h3 className='card-title align-items-start flex-column'>
            <span className='card-label fw-bold fs-3 mb-1'>ລາຍການທຸລະກຳຫຼ້າສຸດ</span>
            <span className='text-muted mt-1 fw-semibold fs-7'>
              ສະແດງ 5 ລາຍການຫຼ້າສຸດ (ອັບເດດສົດ)
            </span>
          </h3>
        </div>

        <div className='card-body py-3'>
          <div className='table-responsive'>
            <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
              <thead>
                <tr className='fw-bold text-muted'>
                  <th className='min-w-150px'>ເລກທີເອກະສານ</th>
                  <th className='min-w-140px'>ລູກຄ້າ</th>
                  <th className='min-w-120px'>ວັນທີ</th>
                  <th className='min-w-100px'>ຍອດເງິນ</th>
                  <th className='min-w-100px text-end'>ສະຖານະ</th>
                </tr>
              </thead>
              <tbody>
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='text-center py-10 text-muted'>
                      <span className='spinner-border spinner-border-sm align-middle ms-2'></span>{' '}
                      ກຳລັງໂຫລດຂໍ້ມູນ...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className='text-center py-10 text-danger fw-bold'>
                      {error}
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='text-center py-10 text-muted'>
                      ບໍ່ມີຂໍ້ມູນປະຫວັດ
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => {
                    const statusInfo  = getStatusBadge(item.status)
                    const displayId   = item.invoiceNumber || item.quotationId || item.paymentNumber || 'N/A'
                    const totalAmount = item.grandTotal ?? item.amount ?? 0
                    const rawDate     = item.issueDate || item.createdAt
                    const dateObj     = new Date(rawDate)
                    const date        = isNaN(dateObj.getTime())
                      ? 'ບໍ່ລະບຸວັນທີ'
                      : dateObj.toLocaleDateString('lo-LA')

                    return (
                      <tr
                        key={item._id}
                        className='row-animate'
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>
                          <div className='d-flex flex-column'>
                            <span className='text-gray-900 fw-bold fs-6'>{displayId}</span>
                            <span className={`fs-8 fw-bold ${getTypeBadge(item.type)}`}>
                              {item.type}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className='text-gray-900 fw-bold d-block fs-6'>
                            {item.customer?.name || 'ລູກຄ້າທົ່ວໄປ'}
                          </span>
                        </td>
                        <td>
                          <span className='text-gray-900 fw-bold d-block fs-6'>{date}</span>
                        </td>
                        <td>
                          <span className='text-gray-900 fw-bold d-block fs-6'>
                            {totalAmount.toLocaleString()} {item.currency || 'LAK'}
                          </span>
                        </td>
                        <td className='text-end'>
                          <span className={clsx('badge fw-bold', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export { TablesWidget9 }  