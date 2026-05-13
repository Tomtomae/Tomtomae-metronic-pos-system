import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, MouseEvent } from 'react'
import { KTIcon } from '../../../_metronic/helpers'
import { InvoiceModel } from '../Invoice/componetInvoice/InvoiceModule'
import InvoiceDetailPopup from './componetInvoice/InvoiceDetailPopup'
import { MenuComponent } from '../../../_metronic/assets/ts/components'
import Swal, { SweetAlertResult } from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { showToast } from '../../../utils/toastAlert'
import { useAuth } from '../../../app/modules/auth'
import axios from 'axios'

const MySwal = withReactContent(Swal)
interface AuthStorageData {
  role?: string
  data?: { role?: string; id?: string }
  user?: { role?: string; id?: string }
  id?: string
}

type InvoiceWithDate = InvoiceModel & { createdAt?: string | Date }

const InvoicePage: React.FC = () => {
  const { auth } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [invoices, setInvoices] = useState<InvoiceModel[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceModel | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage: number = 10

  const API_URL: string = import.meta.env.VITE_APP_API_URL

  const { currentUserRole, currentUserId } = useMemo((): { currentUserRole: string; currentUserId: string } => {
    try {
      const raw = localStorage.getItem('kt-auth-react-v')
      if (!raw) return { currentUserRole: 'employee', currentUserId: '' }
      const parsed = JSON.parse(raw) as AuthStorageData
      const role = parsed?.role || parsed?.data?.role || parsed?.user?.role || 'employee'
      const id = parsed?.id || parsed?.data?.id || parsed?.user?.id || ''
      return { currentUserRole: role, currentUserId: id }
    } catch {
      return { currentUserRole: 'employee', currentUserId: '' }
    }
  }, [])

  const isAdmin = currentUserRole === 'admin'

  const fetchInvoices = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(`${API_URL}/invoice`, {
        headers: { Authorization: `Bearer ${auth?.api_token}` },
      })

      const data: InvoiceModel[] = response.data || []
      setInvoices(data)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || 'ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໃບແຈ້ງໜີ້ໄດ້'
        setError(msg)
        if (error.response?.status === 401) {
          showToast('error', 'Session ໝົດອາຍຸ, ກະລຸນາ Login ໃໝ່')
        }
      } else {
        setError('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່')
      }
    } finally {
      setLoading(false)
      setTimeout(() => MenuComponent.reinitialization(), 500)
    }
  }, [API_URL, auth?.api_token])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // ─── Delete ────────────────────────────────────────────────
  const handleDelete = async (invoice: InvoiceModel): Promise<void> => {
    if (!invoice._id) return
    if (!isAdmin) {
      MySwal.fire({ icon: 'error', title: 'ບໍ່ມີສິດ', text: 'ສະເພາະຜູ້ເບິ່ງແຍງລະບົບ (Admin) ເທົ່ານັ້ນທີ່ສາມາດຍົກເລີກບິນໄດ້' })
      return
    }

    const resultConfirm: SweetAlertResult = await MySwal.fire({
      title: 'ຢືນຢັນການຍົກເລີກ?',
      text: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການຍົກເລີກບິນນີ້?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ຢືນຢັນ',
      cancelButtonText: 'ຍົກເລີກ',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-light',
      },
    })

    if (resultConfirm.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/invoice/delete/${invoice._id}`, {
          headers: { Authorization: `Bearer ${auth?.api_token}` },
        })
        showToast('success', 'ຍົກເລີກບິນສຳເລັດແລ້ວ')
        fetchInvoices()
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data?.message || 'ລຶບບໍ່ສຳເລັດ'
          MySwal.fire({ icon: 'error', title: 'ຜິດພາດ', text: msg })
        } else {
          MySwal.fire({ icon: 'error', title: 'ຜິດພາດ', text: 'ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຮູ້ສາເຫດ' })
        }
      }
    }
  }

  const handleUpdateSuccess = (): void => {
    void fetchInvoices()
  }

  const filteredInvoices = useMemo((): InvoiceModel[] => {
    return invoices
      .filter((inv: InvoiceModel) => {
        if (!isAdmin && currentUserId) {
          const createdById =
            typeof inv.createdBy === 'object' && inv.createdBy !== null
              ? (inv.createdBy as { _id?: string })._id || String(inv.createdBy)
              : String(inv.createdBy ?? '')
          if (createdById !== currentUserId) return false
        }

        const status: string = inv.status?.toLowerCase() || ''
        const matchesTab: boolean = activeTab === 'all' || status === activeTab.toLowerCase()

        const search: string = searchTerm.toLowerCase()
        const customerName: string =
          typeof inv.customer !== 'string' && inv.customer?.name
            ? inv.customer.name.toLowerCase()
            : ''
        const matchesSearch: boolean =
          (inv.invoiceNumber?.toLowerCase() || '').includes(search) ||
          customerName.includes(search)

        const dateToCompare = inv.issueDate || inv.dueDate || (inv as InvoiceWithDate).createdAt
        const itemDate: number = dateToCompare ? new Date(dateToCompare).setHours(0, 0, 0, 0) : 0
        const start: number | null = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null
        const end: number | null = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null
        const matchesDate: boolean = (!start || itemDate >= start) && (!end || itemDate <= end)

        return matchesTab && matchesSearch && matchesDate
      })
      .sort((a: InvoiceModel, b: InvoiceModel) => {
        const dateA: number = new Date(a.issueDate || a.dueDate || (a as InvoiceWithDate).createdAt || 0).getTime()
        const dateB: number = new Date(b.issueDate || b.dueDate || (b as InvoiceWithDate).createdAt || 0).getTime()
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [invoices, activeTab, searchTerm, startDate, endDate, sortOrder, isAdmin, currentUserId])

  const totalPages: number = Math.ceil(filteredInvoices.length / itemsPerPage)
  const indexOfLastItem: number = currentPage * itemsPerPage
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage
  const currentInvoices: InvoiceModel[] = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)

  const resetFilters = (): void => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortOrder('newest')
    setCurrentPage(1)
  }

  const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
    if (amount === undefined) return '0'
    const isLak: boolean = currency?.toUpperCase() === 'LAK'
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: isLak ? 0 : 2,
      maximumFractionDigits: isLak ? 0 : 2,
    })
  }

  const openPaymentPopup = (invoice: InvoiceModel): void => {
    setSelectedInvoice(invoice)
    setIsDetailModalOpen(true)
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className='card card-flush shadow-sm'>
      <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
        <div className='card-title'>
          <div className='d-flex align-items-center position-relative my-1'>
            <KTIcon iconName='magnifier' className='fs-1 position-absolute ms-4' />
            <input
              type='text'
              className='form-control form-control-solid w-250px ps-14'
              placeholder='ຄົ້ນຫາເລກທີ ຫຼື ຊື່ລູກຄ້າ...'
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>

        <div className='card-toolbar flex-row-fluid justify-content-end gap-3'>
          <button
            type='button'
            className='btn btn-light-primary fw-bold'
            data-kt-menu-trigger='click'
            data-kt-menu-placement='bottom-end'
          >
            <KTIcon iconName='filter' className='fs-2' /> ກັ່ນກອງ
          </button>
          <div className='menu menu-sub menu-sub-dropdown w-300px w-md-325px' data-kt-menu='true'>
            <div className='px-7 py-5'>
              <div className='fs-5 text-dark fw-bolder'>ຕົວເລືອກການກອງຂໍ້ມູນ</div>
            </div>
            <div className='separator border-gray-200'></div>
            <div className='px-7 py-5'>
              <div className='mb-5'>
                <label className='form-label fw-bold'>ຊ່ວງວັນທີ:</label>
                <div className='d-flex gap-2'>
                  <input type='date' className='form-control form-control-solid' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <input type='date' className='form-control form-control-solid' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className='mb-5'>
                <label className='form-label fw-bold'>ຮຽງລຳດັບ:</label>
                <select
                  className='form-select form-select-solid'
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                >
                  <option value='newest'>ໃໝ່ສຸດກ່ອນ</option>
                  <option value='oldest'>ເກົ່າສຸດກ່ອນ</option>
                </select>
              </div>
              <div className='d-flex justify-content-end gap-2'>
                <button type='button' className='btn btn-sm btn-light' onClick={resetFilters}>ລ້າງຄ່າ</button>
                <button type='button' className='btn btn-sm btn-primary' data-kt-menu-dismiss='true'>ຕົກລົງ</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='card-body pt-0'>
        {/* ── Tabs ── */}
        <ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bold mb-5'>
          {['all', 'pending', 'partial', 'paid', 'cancelled'].map((tab) => (
            <li className='nav-item' key={tab}>
              <a
                className={`nav-link text-active-primary py-4 me-10 cursor-pointer ${activeTab === tab ? 'active' : ''}`}
                onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault()
                  setActiveTab(tab)
                  setCurrentPage(1)
                }}
                href='#'
              >
                {tab === 'all' ? 'ທັງໝົດ'
                  : tab === 'pending' ? 'ຄ້າງຊຳລະ'
                    : tab === 'partial' ? 'ບາງສ່ວນ'
                      : tab === 'paid' ? 'ຊຳລະແລ້ວ'
                        : 'ຍົກເລີກ'}
                <span className={`badge ms-2 ${activeTab === tab ? 'badge-primary' : 'badge-light-dark'}`}>
                  {tab === 'all'
                    ? filteredInvoices.length
                    : filteredInvoices.filter((i) => (i.status?.toLowerCase() || '') === tab).length}
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* ── Table ── */}
        <div className='table-responsive'>
          {loading ? (
            <div className='d-flex justify-content-center my-10'>
              <div className='spinner-border text-primary'></div>
            </div>
          ) : error ? (
            <div className='alert alert-danger text-center'>{error}</div>
          ) : (
            <>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th className='ps-4'>ເລກທີ</th>
                    <th>ລູກຄ້າ</th>
                    <th>ວັນທີອອກບິນ</th>
                    <th className='text-end'>ຍອດເຕັມ</th>
                    <th className='text-end'>ຄ້າງຊຳລະ</th>
                    <th className='text-center'>ສະຖານະ</th>
                    {/* ✅ Admin ເຫັນ column "ສ້າງໂດຍ" */}
                    {isAdmin && <th className='text-center'>ສ້າງໂດຍ</th>}
                    <th className='text-end pe-4'>ການດຳເນີນ</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {currentInvoices.length > 0 ? (
                    currentInvoices.map((inv) => {
                      const outstanding = (inv.grandTotal || 0) - (inv.totalPaid || 0)
                      // ດຶງຊື່ createdBy ສຳລັບ admin
                      const createdByName =
                        typeof inv.createdBy === 'object' && inv.createdBy !== null
                          ? `${(inv.createdBy as { first_name?: string }).first_name || ''} ${(inv.createdBy as { last_name?: string }).last_name || ''}`.trim()
                          : '-'

                      return (
                        <tr key={inv._id}>
                          <td className='text-dark fw-bold ps-4'>{inv.invoiceNumber}</td>
                          <td>{typeof inv.customer !== 'string' ? inv.customer?.name || 'ບໍ່ລະບຸຊື່' : ''}</td>
                          <td>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('lo-LA') : '-'}</td>
                          <td className='text-end'>
                            {formatCurrency(inv.grandTotal, inv.currency)} {inv.currency}
                          </td>
                          <td className='text-end text-danger fw-bold'>
                            {outstanding > 0 ? formatCurrency(outstanding, inv.currency) : '0'} {inv.currency}
                          </td>
                          <td className='text-center'>
                            <StatusBadge status={inv.status || ''} />
                          </td>
                          {/* ✅ Admin ເຫັນວ່າໃຜສ້າງ */}
                          {isAdmin && (
                            <td className='text-center text-muted fs-7'>{createdByName || '-'}</td>
                          )}
                          <td className='text-end pe-4'>
                            <div className='d-flex justify-content-end gap-2'>
                              <button
                                className='btn btn-sm btn-icon btn-light-primary'
                                onClick={() => openPaymentPopup(inv)}
                                title='ເບິ່ງລາຍລະອຽດ'
                              >
                                <KTIcon iconName='eye' className='fs-3' />
                              </button>
                              {currentUserRole === 'admin' && (
                                <button className='btn btn-sm btn-icon btn-light-danger' onClick={() => handleDelete(inv)} title="ຍົກເລີກບິນ">
                                  <KTIcon iconName='trash' className='fs-3' />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className='text-center py-10 text-muted'>
                        ບໍ່ພົບຂໍ້ມູນບິນ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className='d-flex justify-content-end pt-5'>
                  <div className='pagination pagination-outline'>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        className={`btn btn-icon btn-sm border-0 fw-bold me-2 ${currentPage === i + 1 ? 'btn-primary' : 'btn-light-primary'}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailPopup
          invoice={selectedInvoice}
          show={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdate={handleUpdateSuccess}
        />
      )}
    </div>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase() || ''
  let color = 'light'
  let text = status
  switch (s) {
    case 'paid': color = 'success'; text = 'ຊຳລະແລ້ວ'; break
    case 'partial': color = 'info'; text = 'ບາງສ່ວນ'; break
    case 'pending': color = 'warning'; text = 'ຄ້າງຊຳລະ'; break
    case 'cancelled': color = 'danger'; text = 'ຍົກເລີກ'; break
  }
  return <span className={`badge badge-light-${color} fw-bold`}>{text}</span>
}

export default InvoicePage