import React, { FC, useEffect, useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import clsx from 'clsx'

// --- 1. Definining Interfaces (Strict Types) ---
interface Invoice {
  _id: string
  status: 'Pending' | 'Partial' | 'Paid' | 'Cancelled' | string
  grandTotal?: number
  balanceDue?: number
  dueDate: string
  currency: 'LAK' | 'USD' | 'THB' | string
}

interface SummaryItem {
  label: string
  amount: number
  percentage: number
  colorClass: string
  statusKey: string
}

type Props = {
  className: string
}

const API_URL = import.meta.env.VITE_APP_API_URL
const REFRESH_INTERVAL_MS = 15000 // 15 ວິນາທີ

const TablesWidget5: FC<Props> = ({ className }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)
  const [activeCurrency, setActiveCurrency] = useState<'LAK' | 'THB' | 'USD'>('LAK')

  // --- 2. ດຶງຂໍ້ມູນມາເກັບໄວ້ (ບໍ່ໃຫ້ຍິງ API ຊ້ຳເວລາປ່ຽນ Tab) ---
  const fetchInvoices = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      setError(false)

      const response = await axios.get<Invoice[]>(`${API_URL}/invoice`)
      setInvoices(response.data || [])

    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(true)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices(false)
    const interval = setInterval(() => fetchInvoices(true), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchInvoices])

  const summaryData = useMemo<SummaryItem[]>(() => {
    const now = new Date()
    const totals = { paid: 0, pending: 0, overdue: 0, partial: 0 }
    let currencyTotalVolume = 0

    invoices.forEach((inv) => {
      if (inv.currency === activeCurrency && inv.status !== 'Cancelled') {
        const grandTotal = Number(inv.grandTotal) || 0
        const balanceDue = Number(inv.balanceDue ?? inv.grandTotal) || 0 // ຖ້າບໍ່ມີ balanceDue ໃຫ້ໃຊ້ grandTotal ແທນ

        currencyTotalVolume += grandTotal
        const isOverdue = new Date(inv.dueDate) < now && inv.status !== 'Paid'

        if (inv.status?.toLowerCase() === 'paid') {
          totals.paid += grandTotal
        } else if (isOverdue) {
          totals.overdue += balanceDue
        } else if (inv.status?.toLowerCase() === 'partial') {
          totals.partial += balanceDue
        } else {
          totals.pending += balanceDue
        }
      }
    })

    const getPercent = (value: number) =>
      currencyTotalVolume > 0 ? Math.round((value / currencyTotalVolume) * 100) : 0

    return [
      { label: 'ຊຳລະແລ້ວ', amount: totals.paid, percentage: getPercent(totals.paid), colorClass: 'success', statusKey: 'paid' },
      { label: 'ລໍຖ້າຊຳລະ', amount: totals.pending, percentage: getPercent(totals.pending), colorClass: 'warning', statusKey: 'pending' },
      { label: 'ເກີນກຳໜົດ', amount: totals.overdue, percentage: getPercent(totals.overdue), colorClass: 'danger', statusKey: 'overdue' },
      { label: 'ຊຳລະບາງສ່ວນ', amount: totals.partial, percentage: getPercent(totals.partial), colorClass: 'primary', statusKey: 'partial' },
    ]
  }, [invoices, activeCurrency]) // ຈະຄຳນວນໃໝ່ສະເພາະຕອນທີ່ຂໍ້ມູນປ່ຽນ ຫຼື ກົດປ່ຽນ Tab ເທົ່ານັ້ນ

  return (
    <div className={clsx('card card-flush border-0 shadow-sm', className)}>
      {/* begin::Header */}
      <div className='card-header border-0 pt-7'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold text-gray-900 fs-3'>ສະຫຼຸບສະຖານະໃບແຈ້ງໜີ້</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>ສະແດງຂໍ້ມູນຕາມສະກຸນເງິນທີ່ເລືອກ</span>
        </h3>

        {/* ປຸ່ມ Switch ສະກຸນເງິນ (Tabs) */}
        <div className='card-toolbar'>
          <ul className='nav nav-pills nav-pills-custom'>
            <li className='nav-item'>
              <button
                className={clsx('nav-link btn btn-sm btn-color-muted btn-active-light-primary fw-bold px-4 me-1', { active: activeCurrency === 'LAK' })}
                onClick={() => setActiveCurrency('LAK')}
              >
                LAK (ກີບ)
              </button>
            </li>
            <li className='nav-item'>
              <button
                className={clsx('nav-link btn btn-sm btn-color-muted btn-active-light-primary fw-bold px-4 me-1', { active: activeCurrency === 'THB' })}
                onClick={() => setActiveCurrency('THB')}
              >
                THB (ບາດ)
              </button>
            </li>
            <li className='nav-item'>
              <button
                className={clsx('nav-link btn btn-sm btn-color-muted btn-active-light-primary fw-bold px-4', { active: activeCurrency === 'USD' })}
                onClick={() => setActiveCurrency('USD')}
              >
                USD (ໂດລາ)
              </button>
            </li>
          </ul>
        </div>
      </div>
      {/* end::Header */}

      {/* begin::Body */}
      <div className='card-body pt-5'>
        {loading && invoices.length === 0 ? (
          <div className='text-center py-10'>
            <div className='spinner-border text-primary spinner-border-sm' role='status'></div>
          </div>
        ) : error ? (
          <div className='text-center py-10 text-danger fw-bold'>
            ບໍ່ສາມາດດຶງຂໍ້ມູນສະຫຼຸບໄດ້ໃນຂະນະນີ້
          </div>
        ) : (
          summaryData.map((item) => (
            <div
              className='d-flex flex-column mb-8 px-2 rounded-3 hover-elevate-up'
              key={item.statusKey}
              style={{ transition: 'all 0.3s ease', cursor: 'default' }}
            >
              <div className='d-flex flex-stack mb-2'>
                <div className='d-flex align-items-center'>
                  <div className={clsx('badge badge-circle w-10px h-10px me-3', `bg-${item.colorClass}`)}></div>
                  <span className='text-gray-800 fw-bold fs-6'>{item.label}</span>
                </div>

                <div className='d-flex align-items-center'>
                  <span className={clsx('fw-bolder fs-5 me-2', `text-${item.colorClass}`)}>
                    {item.amount.toLocaleString()}{' '}
                    <span className='fs-8 fw-bold'>{activeCurrency}</span>
                  </span>
                  <span className='text-muted fs-7 fw-bold'>({item.percentage}%)</span>
                </div>
              </div>

              {/* ເສັ້ນ Progress Bar ຍາວໄປທາງຂວາ (ພ້ອມ Animation) */}
              <div className='d-flex align-items-center'>
                <div className='progress h-8px w-100 bg-light-dark bg-opacity-10 rounded'>
                  <div
                    className={clsx('progress-bar rounded', `bg-${item.colorClass}`)}
                    role='progressbar'
                    style={{
                      width: `${item.percentage}%`,
                      transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)', // Animation ທີ່ເຮັດໃຫ້ມັນຍືດອອກແບບສະມູດ
                      boxShadow: `0px 2px 4px rgba(0, 0, 0, 0.1)`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* end::Body */}
    </div>
  )
}

export { TablesWidget5 }