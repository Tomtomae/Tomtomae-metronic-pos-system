import React, { useEffect, useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import { KTIcon } from '../../../_metronic/helpers'
import Swal, { SweetAlertResult } from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { UserModel } from '../auth/core/_models'
import AddUserModal from '../UserManagement/components/AddUserPage'
import EditUserModal from './components/EditeUserPage'

const MySwal = withReactContent(Swal)
const Toast = MySwal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
const API_URL: string = import.meta.env.VITE_APP_API_URL

const getInitials = (u: UserModel) => `${(u.first_name || '').charAt(0)}${(u.last_name || '').charAt(0)}`.toUpperCase() || 'U'

export type UserWithStatus = UserModel & { isDeleted?: boolean }

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<UserWithStatus[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [roleFilter, setRoleFilter] = useState<'' | 'admin' | 'employee'>('')
    const [currentPage, setCurrentPage] = useState<number>(1)
    const itemsPerPage = 10

    const [isAddOpen, setIsAddOpen] = useState<boolean>(false)
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false)
    const [selectedUser, setSelectedUser] = useState<UserModel | null>(null)

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const { data } = await axios.get(`${API_URL}/users`)
            setUsers(data.data || data)
        } catch (err: unknown) {
            setError('ບໍ່ສາມາດດຶງຂໍ້ມູນພະນັກງານໄດ້')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    const handleDelete = async (user: UserWithStatus) => {
        const id = user._id || user.id
        if (!id) return

        const confirm: SweetAlertResult = await MySwal.fire({
            title: 'ຢືນຢັນການລົບ?',
            html: `ຜູ້ໃຊ້ <b>${user.first_name} ${user.last_name}</b> ຈະຖືກ Soft Delete`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ລົບອອກ',
            cancelButtonText: 'ຍົກເລີກ',
            customClass: { confirmButton: 'btn btn-sm btn-danger', cancelButton: 'btn btn-sm btn-light' },
        })
        if (!confirm.isConfirmed) return

        try {
            await axios.delete(`${API_URL}/users/${id}`)
            Toast.fire({ icon: 'success', title: 'ລົບຂໍ້ມູນສຳເລັດ' })
            fetchUsers()
        } catch (err: unknown) {
            MySwal.fire({ icon: 'error', title: 'ຜິດພາດ', text: 'ບໍ່ສາມາດລົບຜູ້ໃຊ້ນີ້ໄດ້' })
        }
    }

    const openAdd = () => { setSelectedUser(null); setIsAddOpen(true) }
    const openEdit = (u: UserModel) => { setSelectedUser(u); setIsEditOpen(true) }

    const filteredData = useMemo(() => {
        const q = searchTerm.toLowerCase()
        return users.filter(u => {
            const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase()
            const matchSearch = !q || name.includes(q) || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
            const matchRole = !roleFilter || u.role === roleFilter
            return matchSearch && matchRole
        })
    }, [users, searchTerm, roleFilter])

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const adminCount = users.filter(u => u.role === 'admin').length
    const activeCount = users.filter(u => !u.isDeleted).length

    return (
        <>
            <div className='d-flex flex-column gap-6'>
                <div className='row g-4'>
                    {[
                        { label: 'ພະນັກງານທັງໝົດ', value: users.length, icon: 'people', colorClass: 'text-primary', bgClass: 'bg-light-primary' },
                        { label: 'ຜູ້ຈັດການ', value: adminCount, icon: 'shield-tick', colorClass: 'text-danger', bgClass: 'bg-light-danger' },
                        { label: 'Active', value: activeCount, icon: 'check-circle', colorClass: 'text-success', bgClass: 'bg-light-success' },
                        { label: 'ສະກຸນເງິນ', value: 3, icon: 'dollar', colorClass: 'text-warning', bgClass: 'bg-light-warning' },
                    ].map((s, i) => (
                        <div className='col-md-3' key={i}>
                            <div className='card border-0 shadow-sm rounded-3'>
                                <div className='card-body p-5'>
                                    <div className={`w-40px h-40px rounded-2 d-flex align-items-center justify-content-center mb-3 ${s.bgClass}`}>
                                        <span className={s.colorClass}>
                                            <KTIcon iconName={s.icon} className='fs-2' />
                                        </span>
                                    </div>
                                    <div className='fs-2hx fw-bold text-gray-800 lh-1 mb-1'>{s.value}</div>
                                    <div className='fs-6 text-gray-500 fw-semibold'>{s.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='card border-0 shadow-sm rounded-3'>
                    <div className='card-header border-0 pt-6'>
                        <div className='card-title'>
                            <div className='d-flex align-items-center position-relative my-1 me-5'>
                                <KTIcon iconName='magnifier' className='fs-3 position-absolute ms-4 text-gray-500 top-50 translate-middle-y' />
                                <input type='text' className='form-control form-control-solid w-250px ps-12' placeholder='ຄົ້ນຫາ ຊື່, email, username...' value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }} />
                            </div>
                            <select className='form-select form-select-solid w-150px' value={roleFilter} onChange={e => { setRoleFilter(e.target.value as '' | 'admin' | 'employee'); setCurrentPage(1) }}>
                                <option value=''>ທັງໝົດ</option>
                                <option value='admin'>ຜູ້ຈັດການ</option>
                                <option value='employee'>ພະນັກງານ</option>
                            </select>
                        </div>
                        <div className='card-toolbar'>
                            <button className='btn btn-primary fw-bold' onClick={openAdd}>
                                <KTIcon iconName='plus' className='fs-2 me-1' /> ສ້າງຜູ້ໃຊ້ໃໝ່
                            </button>
                        </div>
                    </div>

                    <div className='card-body py-4'>
                        {loading ? (
                            <div className='text-center py-20'><div className='spinner-border text-primary mb-3'></div></div>
                        ) : error ? (
                            <div className='alert alert-danger'>{error}</div>
                        ) : (
                            <div className='table-responsive'>
                                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                                    <thead>
                                        <tr className='text-start text-muted fw-bold fs-7 text-uppercase gs-0'>
                                            <th className='min-w-250px'>ຜູ້ໃຊ້</th>
                                            <th className='min-w-100px'>Role</th>
                                            <th className='min-w-150px'>Email</th>
                                            <th className='min-w-100px'>ສະກຸນເງິນ</th>
                                            <th className='min-w-100px text-center'>ສະຖານະ</th>
                                            <th className='text-end min-w-100px'>ການດຳເນີນ</th>
                                        </tr>
                                    </thead>
                                    <tbody className='text-gray-600 fw-semibold'>
                                        {currentItems.map((u, i) => {
                                            const isAdmin = u.role === 'admin'
                                            const badgeColors = ['primary', 'success', 'warning', 'danger', 'info']
                                            const colorName = badgeColors[i % badgeColors.length]
                                            
                                            return (
                                                <tr key={u._id || u.id}>
                                                    <td className='d-flex align-items-center'>
                                                        <div className='symbol symbol-circle symbol-45px overflow-hidden me-3'>
                                                            {u.picUrl && !u.picUrl.includes('blank.png') ? (
                                                                <div className='symbol-label'>
                                                                    <img src={u.picUrl} alt='' className='w-100' />
                                                                </div>
                                                            ) : (
                                                                <div className={`symbol-label fs-3 bg-light-${colorName} text-${colorName}`}>
                                                                    {getInitials(u)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className='d-flex flex-column'>
                                                            <span className='text-gray-800 fw-bold mb-1 fs-6'>{u.first_name} {u.last_name}</span>
                                                            <span className='text-muted fs-7'>@{u.username}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-light-${isAdmin ? 'danger' : 'primary'} fw-bold px-3 py-2`}>
                                                            {isAdmin ? 'Admin' : 'Employee'}
                                                        </span>
                                                    </td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className='fw-bold text-gray-800'>{u.currency || 'LAK'}</span>
                                                        <span className='text-muted ms-1 fs-8'>({u.language || 'lo'})</span>
                                                    </td>
                                                    <td className='text-center'>
                                                        <span className={`badge badge-light-${u.isDeleted ? 'danger' : 'success'} fw-bold px-3 py-2`}>
                                                            {u.isDeleted ? 'Deleted' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className='text-end'>
                                                        <button className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-2' onClick={() => openEdit(u)}>
                                                            <KTIcon iconName='pencil' className='fs-3' />
                                                        </button>
                                                        <button className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm' onClick={() => handleDelete(u)}>
                                                            <KTIcon iconName='trash' className='fs-3' />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {currentItems.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className='text-center text-muted fw-bold py-10'>
                                                    ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ທີ່ຄົ້ນຫາ
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loading && totalPages > 1 && (
                            <div className='d-flex justify-content-between align-items-center flex-wrap pt-5'>
                                <div className='fs-6 fw-semibold text-gray-700'>
                                    ສະແດງ {(currentPage - 1) * itemsPerPage + 1} ເຖິງ {Math.min(currentPage * itemsPerPage, filteredData.length)} ຈາກທັງໝົດ {filteredData.length} ລາຍການ
                                </div>
                                <ul className='pagination'>
                                    <li className={`page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className='page-link' onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><KTIcon iconName='left' className='fs-4' /></button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                            <button className='page-link' onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className='page-link' onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><KTIcon iconName='right' className='fs-4' /></button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddUserModal show={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchUsers} />
            <EditUserModal show={isEditOpen} user={selectedUser} onClose={() => { setIsEditOpen(false); setSelectedUser(null); }} onSuccess={fetchUsers} />
        </>
    )
}

export default UserManagementPage