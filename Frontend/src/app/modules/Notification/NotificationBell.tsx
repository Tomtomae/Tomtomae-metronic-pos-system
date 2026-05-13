import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const API_URL = import.meta.env.VITE_APP_API_URL as string

// --- Interfaces ---
interface NotificationSender {
    _id: string
    first_name: string
    last_name: string
    pic?: string
    picUrl?: string
}

interface Notification {
    _id: string
    type: 'QUOTATION_APPROVAL' | 'QUOTATION_APPROVED' | 'QUOTATION_REJECTED' | 'INVOICE_CREATED' | 'PAYMENT_SUBMITTED' | 'SYSTEM_ALERT' | string
    message: string
    isRead: boolean
    createdAt: string
    sender?: NotificationSender
    referenceId?: string
}

interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

// --- Configuration ---
const getTypeConfig = (type: string) => {
    switch (type) {
        case 'QUOTATION_APPROVAL':
            return { icon: '📄', color: '#009ef7', label: 'ຂໍການອະນຸມັດ' }
        case 'QUOTATION_APPROVED':
            return { icon: '✅', color: '#50cd89', label: 'ອະນຸມັດແລ້ວ' }
        case 'QUOTATION_REJECTED':
            return { icon: '❌', color: '#f1416c', label: 'ຖືກປະຕິເສດ' }
        case 'INVOICE_CREATED':
            return { icon: '🧾', color: '#7239ea', label: 'Invoice ໃໝ່' }
        case 'PAYMENT_SUBMITTED':
            return { icon: '💸', color: '#009ef7', label: 'ແຈ້ງຊຳລະເງິນ' }
        default:
            return { icon: '🔔', color: '#7239ea', label: 'ແຈ້ງເຕືອນ' }
    }
}

const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'ຫາກໍ່ນີ້'
    if (mins < 60) return `${mins} ນາທີກ່ອນ`
    if (hours < 24) return `${hours} ຊົ່ວໂມງກ່ອນ`
    return `${days} ວັນກ່ອນ`
}

// ຟັງຊັນສຳລັບດຶງ Token
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

const NotificationBell: React.FC = () => {
    const navigate = useNavigate()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const [open, setOpen] = useState<boolean>(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [markingAll, setMarkingAll] = useState<boolean>(false)

    const unreadCount = notifications.filter(n => !n.isRead).length

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const token = getAuthToken()
            const res = await axios.get<ApiResponse<Notification[]>>(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setNotifications(res.data.data || [])
        } catch (err: unknown) {
            console.error('Fetch notifications failed')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkRead = async (notif: Notification): Promise<void> => {
        if (!notif.isRead) {
            try {
                const token = getAuthToken()
                await axios.patch(`${API_URL}/notifications/${notif._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    console.error('Mark read failed:', err.response?.data?.message)
                }
            }
        }
        
        setOpen(false)
        
        if (notif.referenceId) {
            if (notif.type.includes('QUOTATION')) {
                navigate(`/quotations?id=${notif.referenceId}`)
            } else if (notif.type.includes('INVOICE')) {
                navigate(`/invoices?id=${notif.referenceId}`)
            } else if (notif.type.includes('PAYMENT')) {
                navigate(`/payments?id=${notif.referenceId}`)
            } else {
                await MySwal.fire({
                    icon: 'info',
                    title: 'ລາຍລະອຽດແຈ້ງເຕືອນ',
                    text: `ລະຫັດອ້າງອີງໜ້າວຽກ: ${notif.referenceId}`,
                    confirmButtonText: 'ປິດໜ້າຈໍ',
                    customClass: { confirmButton: 'btn btn-primary rounded-3', popup: 'rounded-4' }
                })
            }
        }
    }

    const handleMarkAllRead = async (): Promise<void> => {
        const unread = notifications.filter(n => !n.isRead)
        if (!unread.length) return
        try {
            setMarkingAll(true)
            const token = getAuthToken()
            await Promise.all(
                unread.map(n => axios.patch(`${API_URL}/notifications/${n._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                }))
            )
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (err: unknown) {
            console.error('Mark all read failed')
        } finally {
            setMarkingAll(false)
        }
    }

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
                style={{
                    position: 'relative',
                    background: open ? '#f1f1f4' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f1f4')}
                onMouseLeave={e => (e.currentTarget.style.background = open ? '#f1f1f4' : 'transparent')}
                title="ແຈ້ງເຕືອນ"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.3" d="M12 22C13.6569 22 15 20.6569 15 19H9C9 20.6569 10.3431 22 12 22Z" fill={unreadCount > 0 ? '#009ef7' : '#7e8299'} />
                    <path d="M19 15.9987C18.1538 15.2953 17.6 14.2583 17.6 13V9C17.6 6.23858 15.5 3.93333 12.8 3.57143V3C12.8 2.44772 12.3523 2 11.8 2C11.2477 2 10.8 2.44772 10.8 3V3.57143C8.1 3.93333 6 6.23858 6 9V13C6 14.2583 5.44615 15.2953 4.6 15.9987V17H19V15.9987Z" fill={unreadCount > 0 ? '#009ef7' : '#7e8299'} />
                </svg>

                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#f1416c',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        minWidth: '17px',
                        height: '17px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        lineHeight: 1,
                        boxShadow: '0 0 0 2px #fff',
                        animation: unreadCount > 0 ? 'bellPulse 2s infinite' : 'none',
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '380px',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'dropDown 0.2s cubic-bezier(0.21, 1.02, 0.73, 1)',
                }}>
                    <style>{`
                        @keyframes dropDown {
                            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                            to   { opacity: 1; transform: translateY(0)      scale(1);    }
                        }
                        @keyframes bellPulse {
                            0%, 100% { transform: scale(1); }
                            50%      { transform: scale(1.15); }
                        }
                        .notif-item:hover { background: #f8f9fa !important; }
                        .notif-item { transition: background 0.15s; }
                    `}</style>

                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f1f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#181c32' }}>
                                ແຈ້ງເຕືອນ
                            </span>
                            {unreadCount > 0 && (
                                <span style={{ background: '#fff3cd', color: '#856404', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' }}>
                                    {unreadCount} ໃໝ່
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                style={{ background: 'none', border: 'none', color: '#009ef7', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#e8f4fd')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                                {markingAll ? 'ກຳລັງອ່ານ...' : '✓ ອ່ານທັງໝົດ'}
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div className="spinner-border spinner-border-sm text-primary" />
                                <div style={{ marginTop: '8px', color: '#a1a5b7', fontSize: '13px' }}>ກຳລັງໂຫຼດ...</div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
                                <div style={{ color: '#a1a5b7', fontSize: '13px' }}>ຍັງບໍ່ມີແຈ້ງເຕືອນ</div>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const config = getTypeConfig(notif.type)
                                return (
                                    <div
                                        key={notif._id}
                                        className="notif-item"
                                        onClick={() => handleMarkRead(notif)}
                                        style={{ padding: '14px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start', background: notif.isRead ? '#fff' : '#f0f9ff', position: 'relative' }}
                                    >
                                        {!notif.isRead && (
                                            <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: '#009ef7' }} />
                                        )}

                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${config.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px', overflow: 'hidden' }}>
                                            {notif.sender?.picUrl || notif.sender?.pic ? (
                                                <img src={notif.sender.picUrl || notif.sender.pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '20px' }}>{config.icon}</span>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', color: notif.isRead ? '#5e6278' : '#181c32', fontWeight: notif.isRead ? '400' : '600', lineHeight: '1.4', marginBottom: '4px', wordBreak: 'break-word' }}>
                                                {notif.message}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', color: config.color, background: `${config.color}15`, padding: '1px 7px', borderRadius: '10px', fontWeight: '500' }}>
                                                    {config.label}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#a1a5b7' }}>
                                                    {timeAgo(notif.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f1f4', textAlign: 'center' }}>
                            <button
                                onClick={() => { setOpen(false); navigate('/notifications'); }}
                                style={{ background: 'none', border: 'none', color: '#009ef7', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '6px 16px', borderRadius: '8px', width: '100%' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#e8f4fd')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                                ເບິ່ງທັງໝົດ →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationBell