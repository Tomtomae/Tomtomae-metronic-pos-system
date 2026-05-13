import React, { useEffect, useState, useCallback, useMemo, ChangeEvent, MouseEvent } from 'react'
import axios from 'axios'
import { KTIcon } from '../../../_metronic/helpers'
import AddQuotation from './componetQuitation/AddQuotationPage'
import EditQuotation from './componetQuitation/EditQuotation'           // ✅ ເພີ່ມ
import QuotationDetailModal from './componetQuitation/QuotationDetailModal'
import { QuotationModel } from './componetQuitation/QuotationModel'
import { MenuComponent } from '../../../_metronic/assets/ts/components'
import Swal, { SweetAlertResult } from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const Toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast: HTMLElement) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

const API_URL: string = import.meta.env.VITE_APP_API_URL

interface CustomerInfo {
  name?: string
  Iname?: string
}

interface ApiResponse {
  success: boolean
  data?: QuotationModel[]
  message?: string
}

const TAB_LABELS: Record<string, string> = {
  all:      'ທັງໝົດ',
  draft:    'ຮ່າງ',
  sent:     'ສົ່ງແລ້ວ',
  approved: 'ອະນຸມັດແລ້ວ',
  invoiced: 'ອອກໃບບິນແລ້ວ',
  rejected: 'ປະຕິເສດ',
}

const TABS = Object.keys(TAB_LABELS)

const QuotationPage: React.FC = () => {
  const [activeTab,      setActiveTab]      = useState<string>('all')
  const [quotationData,  setQuotationData]  = useState<QuotationModel[]>([])
  const [loading,        setLoading]        = useState<boolean>(true)
  const [error,          setError]          = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [startDate,  setStartDate]  = useState<string>('')
  const [endDate,    setEndDate]    = useState<string>('')
  const [sortOrder,  setSortOrder]  = useState<'newest' | 'oldest'>('newest')

  const [isAddModalOpen,    setIsAddModalOpen]    = useState<boolean>(false)
  const [selectedId,        setSelectedId]        = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

  // ✅ State ສຳລັບ EditQuotation
  const [isEditModalOpen,   setIsEditModalOpen]   = useState<boolean>(false)
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationModel | null>(null)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10

  // ── Fetch ──────────────────────────────────────────────────
  const fetchQuotations = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<QuotationModel[] | ApiResponse>(`${API_URL}/quotations`)
      const actualData: QuotationModel[] = Array.isArray(data)
        ? data
        : (data as ApiResponse).data || []
      setQuotationData(actualData)
      setTimeout(() => MenuComponent.reinitialization(), 500)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) setError('ໝົດເວລາເຂົ້າສູ່ລະບົບ — ກະລຸນາ Login ໃໝ່')
        else setError(err.response?.data?.message || 'ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້')
      } else {
        setError('ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດ')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuotations() }, [fetchQuotations])

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id: string): Promise<void> => {
    if (!id) return
    const confirm: SweetAlertResult = await MySwal.fire({
      title: 'ຢືນຢັນການລົບ?',
      text: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບໃບສະເໜີລາຄານີ້?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ລົບອອກ',
      cancelButtonText: 'ຍົກເລີກ',
      customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-light' },
    })
    if (!confirm.isConfirmed) return
    try {
      await axios.delete(`${API_URL}/quotations/${id}`)
      Toast.fire({ icon: 'success', title: 'ລົບຂໍ້ມູນສຳເລັດ' })
      fetchQuotations()
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດໃນການລົບ'
        : 'ເກີດຂໍ້ຜິດພາດ'
      MySwal.fire({ icon: 'error', title: 'ຜິດພາດ', text: msg })
    }
  }

  // ── Open Edit ──────────────────────────────────────────────
  const handleOpenEdit = (item: QuotationModel): void => {
    // ✅ ສະແດງ Edit ສະເພາະ Draft ເທົ່ານັ້ນ
    if (item.status !== 'Draft') {
      Toast.fire({ icon: 'warning', title: 'ສາມາດແກ້ໄຂໄດ້ສະເພາະ Draft ເທົ່ານັ້ນ' })
      return
    }
    setSelectedQuotation(item)
    setIsEditModalOpen(true)
  }

  // ── Callbacks ──────────────────────────────────────────────
  const handleSaveSuccess = (): void => {
    fetchQuotations()
    setIsAddModalOpen(false)
    Toast.fire({ icon: 'success', title: 'ບັນທຶກຂໍ້ມູນສຳເລັດ' })
  }

  const handleEditSuccess = (updated: QuotationModel): void => {
    setQuotationData(prev =>
      prev.map(q => q._id === updated._id ? updated : q)
    )
    setIsEditModalOpen(false)
    Toast.fire({ icon: 'success', title: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' })
  }

  const handleViewDetail = (id: string): void => {
    setSelectedId(id)
    setIsDetailModalOpen(true)
  }

  const resetFilters = (): void => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortOrder('newest')
    setCurrentPage(1)
  }

  // ── Helpers ────────────────────────────────────────────────
  const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
    if (amount === undefined) return '0'
    const isLak = currency?.toUpperCase() === 'LAK'
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: isLak ? 0 : 2,
      maximumFractionDigits: isLak ? 0 : 2,
    })
  }

  const getCurrencySymbol = (currency: string | undefined): string => {
    switch (currency?.toUpperCase()) {
      case 'USD': return '$'
      case 'THB': return '฿'
      default:    return '₭'
    }
  }

  const getStatusBadgeColor = (status: string | undefined): string => {
    switch (status?.toLowerCase()) {
      case 'approved': case 'invoiced': return 'success'
      case 'sent':     return 'primary'
      case 'rejected': case 'declined': return 'danger'
      case 'expired':  return 'warning'
      default:         return 'info'
    }
  }

  const getStatusLabel = (status: string | undefined): string => {
    switch (status?.toLowerCase()) {
      case 'draft':    return 'ຮ່າງ'
      case 'sent':     return 'ສົ່ງແລ້ວ'
      case 'approved': return 'ອະນຸມັດແລ້ວ'
      case 'invoiced': return 'ອອກໃບບິນ'
      case 'rejected':
      case 'declined': return 'ປະຕິເສດ'
      case 'expired':  return 'ໝົດອາຍຸ'
      default:         return status || 'ຮ່າງ'
    }
  }

  // ── Filter & Sort ──────────────────────────────────────────
  const filteredData = useMemo((): QuotationModel[] => {
    return quotationData
      .filter((item: QuotationModel) => {
        const cust = item.customer as CustomerInfo | string
        const customerName =
          typeof cust === 'object' && cust !== null
            ? cust.Iname || cust.name || ''
            : (cust as string) || ''

        const matchesSearch =
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.quotationId || '').toLowerCase().includes(searchTerm.toLowerCase())

        const matchesTab =
          activeTab === 'all' || item.status?.toLowerCase() === activeTab.toLowerCase()

        const itemDate = item.issueDate ? new Date(item.issueDate).setHours(0, 0, 0, 0) : 0
        const start    = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null
        const end      = endDate   ? new Date(endDate).setHours(23, 59, 59, 999) : null
        const matchesDate = (!start || itemDate >= start) && (!end || itemDate <= end)

        return matchesSearch && matchesTab && matchesDate
      })
      .sort((a, b) => {
        const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0
        const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [quotationData, searchTerm, activeTab, startDate, endDate, sortOrder])

  // ── Pagination ─────────────────────────────────────────────
  const totalPages   = Math.ceil(filteredData.length / itemsPerPage)
  const indexOfLast  = currentPage * itemsPerPage
  const indexOfFirst = indexOfLast - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast)

  const getTabCount = (tab: string) =>
    tab === 'all'
      ? quotationData.length
      : quotationData.filter(i => i.status?.toLowerCase() === tab).length

  // ── JSX ────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: '20px' }}>
      <div className='card card-flush shadow-sm'>
        {/* ── Header ── */}
        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <KTIcon iconName='magnifier' className='fs-1 position-absolute ms-4' />
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='ຄົ້ນຫາເລກທີ ຫຼື ລູກຄ້າ...'
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          <div className='card-toolbar'>
            <button
              type='button'
              className='btn btn-light-primary fw-bold me-3'
              data-kt-menu-trigger='click'
              data-kt-menu-placement='bottom-end'
            >
              <KTIcon iconName='filter' className='fs-2' /> ກັ່ນກອງ
            </button>

            <div className='menu menu-sub menu-sub-dropdown w-300px w-md-325px' data-kt-menu='true'>
              <div className='px-7 py-5'>
                <div className='fs-5 text-dark fw-bolder'>ຕົວເລືອກການກັ່ນກອງ</div>
              </div>
              <div className='separator border-gray-200'></div>
              <div className='px-7 py-5'>
                <div className='mb-5'>
                  <label className='form-label fw-bold'>ຊ່ວງວັນທີ:</label>
                  <div className='d-flex gap-2'>
                    <input type='date' className='form-control form-control-solid'
                      value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type='date' className='form-control form-control-solid'
                      value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className='mb-5'>
                  <label className='form-label fw-bold'>ລຽງຕາມ:</label>
                  <select className='form-select form-select-solid' value={sortOrder}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setSortOrder(e.target.value as 'newest' | 'oldest')}>
                    <option value='newest'>ໃໝ່ສຸດກ່ອນ</option>
                    <option value='oldest'>ເກົ່າສຸດກ່ອນ</option>
                  </select>
                </div>
                <div className='d-flex justify-content-end'>
                  <button type='button' className='btn btn-sm btn-light me-2' onClick={resetFilters}>ລ້າງຄ່າ</button>
                  <button type='button' className='btn btn-sm btn-primary' data-kt-menu-dismiss='true'>ຕົກລົງ</button>
                </div>
              </div>
            </div>

            <button className='btn btn-primary fw-bold' onClick={() => setIsAddModalOpen(true)}>
              <KTIcon iconName='plus' className='fs-2 me-2' /> ສ້າງໃບສະເໜີລາຄາ
            </button>
          </div>
        </div>

        <div className='card-body pt-10'>
          {/* ── Tabs ── */}
          <ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bold mb-5'>
            {TABS.map((tab: string) => (
              <li className='nav-item' key={tab}>
                <a
                  className={`nav-link text-active-primary py-4 me-6 cursor-pointer ${activeTab === tab ? 'active' : ''}`}
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    setActiveTab(tab)
                    setCurrentPage(1)
                  }}
                  href='#'
                >
                  {TAB_LABELS[tab]}
                  <span className={`badge ms-2 ${activeTab === tab ? 'badge-primary' : 'badge-light-dark'}`}>
                    {getTabCount(tab)}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* ── Table ── */}
          <div className='table-responsive'>
            {loading ? (
              <div className='d-flex flex-column align-items-center py-15'>
                <div className='spinner-border text-primary' role='status'></div>
                <span className='text-muted mt-3'>ກຳລັງໂຫຼດຂໍ້ມູນ...</span>
              </div>
            ) : error ? (
              <div className='alert alert-danger d-flex align-items-center p-5'>
                <KTIcon iconName='information-5' className='fs-2 text-danger me-3' />
                <div className='d-flex align-items-center gap-4'>
                  <span className='fw-bold'>{error}</span>
                  <button className='btn btn-sm btn-danger' onClick={fetchQuotations}>ລອງໃໝ່</button>
                </div>
              </div>
            ) : (
              <>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th className='min-w-100px ps-4'>ເລກທີໃບສະເໜີ</th>
                      <th className='min-w-150px'>ລູກຄ້າ</th>
                      <th className='min-w-100px'>ວັນທີອອກ</th>
                      <th className='min-w-120px text-end'>ຍອດລວມ</th>
                      <th className='min-w-100px text-center'>ສະຖານະ</th>
                      <th className='text-end min-w-120px pe-4'>ການດຳເນີນ</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {currentItems.length > 0 ? (
                      currentItems.map((item: QuotationModel) => {
                        const customer = item.customer as CustomerInfo | string
                        const displayName =
                          typeof customer === 'object' && customer !== null
                            ? customer.Iname || customer.name || 'ບໍ່ຮູ້ຊື່'
                            : (customer as string) || 'ບໍ່ຮູ້ຊື່'

                        return (
                          <tr key={item._id || item.quotationId}>
                            <td className='text-dark fw-bold ps-4'>{item.quotationId || '-'}</td>
                            <td>
                              <span className='text-gray-800 fw-semibold'>{displayName}</span>
                            </td>
                            <td>
                              {item.issueDate
                                ? new Date(item.issueDate).toLocaleDateString('lo-LA')
                                : '-'}
                            </td>
                            <td className='text-dark fw-bold text-end'>
                              {formatCurrency(item.grandTotal, item.currency)}{' '}
                              {getCurrencySymbol(item.currency)}
                            </td>
                            <td className='text-center'>
                              <span className={`badge badge-light-${getStatusBadgeColor(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            </td>
                            <td className='text-end pe-4'>
                              {/* ── ເບິ່ງລາຍລະອຽດ ── */}
                              <button
                                className='btn btn-sm btn-icon btn-bg-light btn-active-color-primary me-1'
                                onClick={() => handleViewDetail(item.quotationId || '')}
                                title='ເບິ່ງລາຍລະອຽດ'
                              >
                                <KTIcon iconName='eye' className='fs-2' />
                              </button>

                              {/* ✅ ແກ້ໄຂ — ສະແດງສະເພາະ Draft */}
                              {item.status === 'Draft' && (
                                <button
                                  className='btn btn-sm btn-icon btn-bg-light btn-active-color-success me-1'
                                  onClick={() => handleOpenEdit(item)}
                                  title='ແກ້ໄຂ'
                                >
                                  <KTIcon iconName='pencil' className='fs-2' />
                                </button>
                              )}

                              {/* ── ລົບ ── */}
                              <button
                                className='btn btn-sm btn-icon btn-bg-light btn-active-color-danger'
                                onClick={() => handleDelete(item._id || '')}
                                title='ລົບ'
                              >
                                <KTIcon iconName='trash' className='fs-2' />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className='text-center py-15'>
                          <div className='d-flex flex-column align-items-center'>
                            <KTIcon iconName='search-list' className='fs-3x text-gray-300 mb-3' />
                            <span className='text-muted fw-semibold fs-6'>ບໍ່ພົບຂໍ້ມູນທີ່ທ່ານຄົ້ນຫາ</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div className='d-flex justify-content-between align-items-center pt-5 border-top'>
                    <span className='text-gray-600 fs-7 fw-semibold'>
                      ສະແດງ {indexOfFirst + 1}–{Math.min(indexOfLast, filteredData.length)} ຈາກທັງໝົດ{' '}
                      <strong>{filteredData.length}</strong> ລາຍການ
                    </span>
                    <div className='d-flex align-items-center gap-2'>
                      <button className='btn btn-icon btn-sm btn-light-primary'
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}>
                        <i className='ki-duotone ki-left fs-2'></i>
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i}
                          className={`btn btn-icon btn-sm border-0 fw-bold ${currentPage === i + 1 ? 'btn-primary' : 'btn-light-primary'}`}
                          onClick={() => setCurrentPage(i + 1)}>
                          {i + 1}
                        </button>
                      ))}
                      <button className='btn btn-icon btn-sm btn-light-primary'
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}>
                        <i className='ki-duotone ki-right fs-2'></i>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AddQuotation
        show={isAddModalOpen}
        handleClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveSuccess}
        existingQuotations={quotationData}
      />

      {/* ✅ EditQuotation Modal */}
      <EditQuotation
        show={isEditModalOpen}
        handleClose={() => { setIsEditModalOpen(false); setSelectedQuotation(null); }}
        onSave={handleEditSuccess}
        quotation={selectedQuotation}
      />

      <QuotationDetailModal
        show={isDetailModalOpen}
        handleClose={() => setIsDetailModalOpen(false)}
        quotationId={selectedId}
        onUpdate={fetchQuotations}
      />
    </div>
  )
}

export default QuotationPage