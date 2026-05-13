import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import Swal, { SweetAlertResult } from 'sweetalert2'
import { KTIcon } from '../../../_metronic/helpers'
import QuotationDetailModal from '../Quotation/componetQuitation/QuotationDetailModal'

// =========================
// Interfaces
// =========================
export interface NotificationModel {
  _id: string
  type: 'QUOTATION_APPROVAL' | 'QUOTATION_APPROVED' | 'QUOTATION_REJECTED' | string
  message: string
  isRead: boolean
  createdAt: string
  referenceId?: string
}

interface StyleConfig {
  icon: string
  color: string
  bg: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

const API_URL: string = import.meta.env.VITE_APP_API_URL

// =========================
// Utility
// =========================
const getAuthToken = (): string => {
  const authDataString = localStorage.getItem('kt-auth-react-v')

  if (authDataString) {
    try {
      const authData = JSON.parse(authDataString)
      return authData?.api_token || authData?.token || ''
    } catch {
      return ''
    }
  }

  return localStorage.getItem('token') || ''
}

const NotificationPage: React.FC = () => {
  // =========================
  // States
  // =========================
  const [notifications, setNotifications] = useState<NotificationModel[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)

  // =========================
  // Fetch Notifications
  // =========================
  const fetchNotifications = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      const token = getAuthToken()

      const response = await axios.get<ApiResponse<NotificationModel[]>>(
        `${API_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = response.data.data

      setNotifications(Array.isArray(data) ? data : [])
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // =========================
  // Open Notification
  // =========================
  const handleOpenAction = async (notif: NotificationModel): Promise<void> => {
    if (!notif.isRead) {
      try {
        const token = getAuthToken()

        await axios.patch(
          `${API_URL}/notifications/${notif._id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id
              ? {
                  ...n,
                  isRead: true,
                }
              : n
          )
        )
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error(error.response?.data?.message)
        }
      }
    }

    if (!notif.referenceId) {
      await Swal.fire({
        icon: 'info',
        title: 'ແຈ້ງເຕືອນ',
        text: 'ບໍ່ມີເອກະສານອ້າງອີງ',
        customClass: {
          popup: 'rounded-4',
        },
      })

      return
    }

    if (notif.type.includes('QUOTATION')) {
      setSelectedQuotationId(notif.referenceId)
      setIsModalOpen(true)
    } else {
      await Swal.fire({
        icon: 'info',
        title: 'ລະບົບ',
        text: 'ຍັງບໍ່ຮອງຮັບແຈ້ງເຕືອນນີ້',
        customClass: {
          popup: 'rounded-4',
        },
      })
    }
  }

  // =========================
  // Delete Notification
  // =========================
  const handleDeleteAction = async (
    notifId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.stopPropagation()

    const result: SweetAlertResult = await Swal.fire({
      title: 'ຢືນຢັນການລຶບ?',
      text: 'ທ່ານຈະບໍ່ສາມາດກູ້ຄືນໄດ້',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f1416c',
      cancelButtonColor: '#7E8299',
      confirmButtonText: 'ລຶບ',
      cancelButtonText: 'ຍົກເລີກ',
      customClass: {
        popup: 'rounded-4',
      },
    })

    if (result.isConfirmed) {
      try {
        const token = getAuthToken()

        await axios.delete<ApiResponse<null>>(
          `${API_URL}/notifications/${notifId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setNotifications((prev) => prev.filter((n) => n._id !== notifId))

        await Swal.fire({
          icon: 'success',
          title: 'ລຶບສຳເລັດ',
          timer: 1000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-4',
          },
        })
      } catch (error: unknown) {
        let message = 'ບໍ່ສາມາດລຶບໄດ້'

        if (axios.isAxiosError(error)) {
          message = error.response?.data?.message || message
        }

        await Swal.fire({
          icon: 'error',
          title: 'ຜິດພາດ',
          text: message,
          customClass: {
            popup: 'rounded-4',
          },
        })
      }
    }
  }

  // =========================
  // Notification Style
  // =========================
  const getStyle = (type: string): StyleConfig => {
    const configs: Record<string, StyleConfig> = {
      QUOTATION_APPROVAL: {
        icon: 'document',
        color: 'primary',
        bg: 'bg-light-primary',
      },

      QUOTATION_APPROVED: {
        icon: 'check-circle',
        color: 'success',
        bg: 'bg-light-success',
      },

      QUOTATION_REJECTED: {
        icon: 'cross-circle',
        color: 'danger',
        bg: 'bg-light-danger',
      },
    }

    return (
      configs[type] || {
        icon: 'notification-on',
        color: 'info',
        bg: 'bg-light-info',
      }
    )
  }

  // =========================
  // Render
  // =========================
  return (
    <>
      <div className='card border-0 shadow-sm mt-5'>
        {/* Header */}
        <div className='card-header border-0 pt-7 pb-5'>
          <div className='d-flex justify-content-between align-items-center flex-wrap gap-4 w-100'>
            <div>
              <h2 className='fw-bolder text-dark d-flex align-items-center mb-2'>
                <KTIcon
                  iconName='notification-bing'
                  className='fs-1 text-primary me-3'
                />

                ສູນແຈ້ງເຕືອນ
              </h2>

              <div className='text-muted fw-semibold fs-6'>
                ທ່ານມີ{' '}
                <span className='text-primary fw-bolder'>
                  {notifications.filter((n) => !n.isRead).length}
                </span>{' '}
                ລາຍການທີ່ຍັງບໍ່ໄດ້ອ່ານ
              </div>
            </div>

            <button
              type='button'
              className='btn btn-icon btn-light-primary w-45px h-45px'
              onClick={fetchNotifications}
              disabled={loading}
            >
              {loading ? (
                <span className='spinner-border spinner-border-sm'></span>
              ) : (
                <KTIcon iconName='arrows-circle' className='fs-2' />
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className='card-body p-8 bg-light-primary'>
          {loading && notifications.length === 0 ? (
            <div className='d-flex flex-column align-items-center justify-content-center py-20'>
              <span className='spinner-border text-primary mb-5'></span>

              <div className='text-muted fw-semibold fs-5'>
                ກຳລັງໂຫຼດ...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className='text-center py-20'>
              <div className='symbol symbol-100px mx-auto mb-5'>
                <div className='symbol-label bg-white shadow-sm rounded-circle'>
                  <KTIcon
                    iconName='notification-on'
                    className='fs-1 text-gray-400'
                  />
                </div>
              </div>

              <div className='fw-bolder fs-2 text-gray-700 mb-2'>
                ບໍ່ມີແຈ້ງເຕືອນ
              </div>

              <div className='text-muted fs-6'>
                ລາຍການແຈ້ງເຕືອນຈະສະແດງຢູ່ນີ້
              </div>
            </div>
          ) : (
            <div className='d-flex flex-column gap-5'>
              {notifications.map((notif) => {
                const style = getStyle(notif.type)

                return (
                  <div
                    key={notif._id}
                    className='position-relative bg-white rounded-4 border border-gray-200 shadow-sm px-6 py-5 cursor-pointer overflow-hidden'
                    onClick={() => handleOpenAction(notif)}
                    style={{
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {/* Left Status Bar */}
                    <div
                      className={`position-absolute top-0 start-0 h-100 bg-${style.color}`}
                      style={{
                        width: '5px',
                        opacity: notif.isRead ? 0.4 : 1,
                      }}
                    />

                    <div className='d-flex align-items-start'>
                      {/* Icon */}
                      <div className='me-5'>
                        <div className='symbol symbol-55px'>
                          <div
                            className={`
                              symbol-label
                              ${style.bg}
                            `}
                          >
                            <KTIcon
                              iconName={style.icon}
                              className={`fs-2qx text-${style.color}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className='flex-grow-1'>
                        <div className='d-flex justify-content-between align-items-start flex-wrap gap-4'>
                          <div className='flex-grow-1 pe-5'>
                            {/* Type */}
                            <div className='d-flex align-items-center mb-3'>
                              <span
                                className={`
                                  badge
                                  badge-light-${style.color}
                                  fw-bold
                                  me-3
                                `}
                              >
                                {notif.type.replaceAll('_', ' ')}
                              </span>

                              {!notif.isRead && (
                                <span className='badge badge-primary'>
                                  NEW
                                </span>
                              )}
                            </div>

                            {/* Message */}
                            <div
                              className={`
                                fs-5
                                ${
                                  notif.isRead
                                    ? 'fw-semibold text-gray-700'
                                    : 'fw-bolder text-dark'
                                }
                              `}
                            >
                              {notif.message}
                            </div>

                            {/* Time */}
                            <div className='d-flex align-items-center text-muted fs-7 mt-4'>
                              <KTIcon
                                iconName='calendar-8'
                                className='fs-7 me-2'
                              />

                              {new Date(notif.createdAt).toLocaleString(
                                'lo-LA'
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className='d-flex align-items-center gap-2'>
                            <button
                              type='button'
                              className='btn btn-sm btn-icon btn-light-primary'
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenAction(notif)
                              }}
                            >
                              <KTIcon
                                iconName='eye'
                                className='fs-4'
                              />
                            </button>

                            <button
                              type='button'
                              className='btn btn-sm btn-icon btn-light-danger'
                              onClick={(e) =>
                                handleDeleteAction(notif._id, e)
                              }
                            >
                              <KTIcon
                                iconName='trash'
                                className='fs-4'
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <QuotationDetailModal
        show={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        quotationId={selectedQuotationId}
        onUpdate={fetchNotifications}
      />
    </>
  )
}

export default NotificationPage