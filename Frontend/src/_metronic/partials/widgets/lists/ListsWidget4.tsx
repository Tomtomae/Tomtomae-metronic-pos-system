import React, { FC, useEffect, useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import clsx from 'clsx'

// --- 1. Definining Interfaces ---
interface CustomerInfo {
  _id: string
  name: string
}

interface Invoice {
  _id: string
  customer?: CustomerInfo
  grandTotal: number
  currency: 'LAK' | 'USD' | 'THB' | string
  status: string
}

interface BestCustomer {
  customerId: string
  name: string
  totalSpent: number
  currency: string
}

type Props = {
  className: string
  items?: number
}

const API_URL = import.meta.env.VITE_APP_API_URL
const REFRESH_INTERVAL_MS = 15000 // ອັບເດດທຸກໆ 15 ວິນາທີ

// 🌟 Animation Styles
const animationStyles = `
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .list-animate {
    opacity: 0;
    animation: slideInUp 0.4s ease-out forwards;
  }
`

const ListsWidget4: FC<Props> = ({ className, items = 5 }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)
  const [activeCurrency, setActiveCurrency] = useState<'LAK' | 'THB' | 'USD'>('LAK')

  // --- 2. ດຶງຂໍ້ມູນບິນທັງໝົດມາເກັບໄວ້ (ບໍ່ໃຫ້ຍິງ API ຊ້ຳເວລາປ່ຽນ Tab) ---
  const fetchInvoices = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      setError(false)

      const response = await axios.get<Invoice[]>(`${API_URL}/invoice`)
      setInvoices(response.data || [])

    } catch (err) {
      console.error('Fetch Best Customers Error:', err)
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

  // --- 3. ຄຳນວນຫາລູກຄ້າ Top ແບບ Real-time ແຍກຕາມ Tab ທີ່ເລືອກ ---
  const topCustomers = useMemo<BestCustomer[]>(() => {
    const aggregationMap = new Map<string, BestCustomer>()

    invoices.forEach((inv) => {
      // ກັ່ນຕອງບິນທີ່ບໍ່ໄດ້ຍົກເລີກ ແລະ ມີລູກຄ້າ
      if (inv.status?.toLowerCase() !== 'cancelled' && inv.customer?._id) {
        const currency = inv.currency?.toUpperCase() || 'LAK'

        // 💡 ເອົາສະເພາະຍອດເງິນທີ່ກົງກັບ Tab ທີ່ເລືອກ
        if (currency === activeCurrency) {
          const customerId = inv.customer._id
          const current = aggregationMap.get(customerId)
          const amount = Number(inv.grandTotal) || 0

          if (current) {
            current.totalSpent += amount
          } else {
            aggregationMap.set(customerId, {
              customerId: customerId,
              name: inv.customer.name || 'ລູກຄ້າທົ່ວໄປ',
              totalSpent: amount,
              currency: currency,
            })
          }
        }
      }
    })

    // ຈັດລຽງຕາມຍອດຊື້ຈາກຫຼາຍໄປຫາໜ້ອຍ ແລ້ວຕັດເອົາຕາມຈຳນວນທີ່ກຳນົດ
    return Array.from(aggregationMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, items)

  }, [invoices, activeCurrency, items]) // ຄຳນວນໃໝ່ສະເພາະຕອນຂໍ້ມູນປ່ຽນ ຫຼື ປ່ຽນ Tab ໃໝ່

  // Helper ດຶງຕົວອັກສອນທຳອິດຂອງຊື່ເພື່ອເຮັດຮູບ Avatar
  const getInitials = (name: string) => (name ? name.substring(0, 1).toUpperCase() : 'ລ')
  
  // Helper ສຸ່ມສີ Avatar ໃຫ້ລູກຄ້າແຕ່ລະຄົນ
  const getAvatarColor = (index: number) => {
    const colors = ['primary', 'success', 'danger', 'warning', 'info']
    return colors[index % colors.length]
  }

  return (
    <>
      <style>{animationStyles}</style>
      
      <div className={clsx('card card-flush border-0 shadow-sm', className)}>
        {/* Header ພ້ອມ Tabs */}
        <div className='card-header pt-7'>
          <h3 className='card-title align-items-start flex-column'>
            <span className='card-label fw-bold text-gray-900 fs-3'>ລູກຄ້າທີ່ຊື້ຫຼາຍທີ່ສຸດ</span>
            <span className='text-muted mt-1 fw-semibold fs-7'>ຈັດອັນດັບຕາມຍອດສັ່ງຊື້</span>
          </h3>

          {/* 🌟 ປຸ່ມ Switch ສະກຸນເງິນ (Tabs) */}
          <div className='card-toolbar'>
            <ul className='nav nav-pills nav-pills-custom'>
              <li className='nav-item'>
                <button
                  className={clsx('nav-link btn btn-sm btn-color-muted btn-active-light-primary fw-bold px-4 me-1', { active: activeCurrency === 'LAK' })}
                  onClick={() => setActiveCurrency('LAK')}
                >
                  LAK
                </button>
              </li>
              <li className='nav-item'>
                <button
                  className={clsx('nav-link btn btn-sm btn-color-muted btn-active-light-primary fw-bold px-4 me-1', { active: activeCurrency === 'THB' })}
                  onClick={() => setActiveCurrency('THB')}
                >
                  THB
                </button>
              </li>
              <li className='nav-item'>
                <button
                  className={clsx('nav-link btn btn-sm btn-color-muted btn-active-light-primary fw-bold px-4', { active: activeCurrency === 'USD' })}
                  onClick={() => setActiveCurrency('USD')}
                >
                  USD
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Body */}
        <div className='card-body pt-5'>
          {/* Table Header Look-alike */}
          <div className='d-flex flex-stack fw-bold text-muted fs-8 text-uppercase mb-4 px-2'>
            <span className='min-w-150px'>ຂໍ້ມູນລູກຄ້າ</span>
            <span className='text-end'>ຍອດລວມ ({activeCurrency})</span>
          </div>

          {loading && invoices.length === 0 ? (
            <div className='d-flex align-items-center justify-content-center py-10'>
              <div className='spinner-border text-primary spinner-border-sm' role='status'></div>
              <span className='ms-3 text-muted fs-7'>ກຳລັງໂຫລດຂໍ້ມູນ...</span>
            </div>
          ) : error ? (
            <div className='text-center py-10 text-danger fw-bold fs-7'>
              ບໍ່ສາມາດດຶງຂໍ້ມູນລູກຄ້າໄດ້ໃນຂະນະນີ້
            </div>
          ) : topCustomers.length === 0 ? (
            <div className='text-center py-10 text-muted fs-7'>
              ບໍ່ມີຍອດການສັ່ງຊື້ໃນສະກຸນເງິນ <span className='fw-bold text-dark'>{activeCurrency}</span>
            </div>
          ) : (
            topCustomers.map((customer, index) => (
              <div
                className={clsx(
                  'd-flex flex-stack py-4 px-3 rounded-2 hover-bg-light transition-all list-animate',
                  {
                    'mb-2': index !== topCustomers.length - 1,
                    'bg-light-primary border border-dashed border-primary border-opacity-25': index === 0,
                  }
                )}
                key={`${activeCurrency}-${customer.customerId}`} // ປ່ຽນ Key ເພື່ອໃຫ້ Animation ເຮັດວຽກໃໝ່ເວລາກົດປ່ຽນ Tab
                style={{ cursor: 'default', animationDelay: `${index * 0.1}s` }}
              >
                {/* ຝັ່ງຊ້າຍ: Avatar ແລະ ຊື່ລູກຄ້າ */}
                <div className='d-flex align-items-center me-2'>
                  <div className={clsx('symbol symbol-40px me-3')}>
                    <div className={clsx('symbol-label fs-5 fw-bold', `bg-light-${getAvatarColor(index)} text-${getAvatarColor(index)}`)}>
                      {getInitials(customer.name)}
                    </div>
                  </div>
                  
                  <div className='d-flex flex-column'>
                    <span className='text-gray-900 fw-bold fs-6'>
                      {customer.name}
                    </span>
                    {index === 0 ? (
                      <span className='text-primary fs-8 fw-bold mt-1'>
                        <i className='bi bi-trophy-fill text-primary me-1'></i> ອັນດັບ 1
                      </span>
                    ) : (
                      <span className='text-muted fs-8 fw-semibold mt-1'>
                        ລູກຄ້າທົ່ວໄປ
                      </span>
                    )}
                  </div>
                </div>

                {/* ຝັ່ງຂວາ: ຍອດເງິນ */}
                <div className='text-end ms-2 d-flex flex-column'>
                  <span className='text-gray-900 fw-bolder fs-5'>
                    {customer.totalSpent.toLocaleString()}
                  </span>
                  <span className='text-muted fw-bold fs-8'>{customer.currency}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export { ListsWidget4 }