import { FC } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../core/Auth'

interface Props {
  allowedRoles: string[]
}

const RoleRoute: FC<Props> = ({ allowedRoles }) => {
  const { currentUser } = useAuth()

  // 🌟 ສົມມຸດວ່າ Backend ຂອງທ່ານສົ່ງ role ມາພ້ອມຕອນ Login
  // ຖ້າຍັງບໍ່ມີ ໃຫ້ຕັ້ງຄ່າ Default ເປັນ 'employee' ໄປກ່ອນ
  // ໝາຍເຫດ: ທ່ານອາດຈະຕ້ອງໄປເພີ່ມ 'role' ໃນ interface UserModel ຂອງ Metronic ນຳ
  const userRole = currentUser?.role || 'employee' 

  // ຖ້າ Role ຂອງຜູ້ໃຊ້ ບໍ່ຢູ່ໃນ List ທີ່ອະນຸຍາດ
  if (!allowedRoles.includes(userRole)) {
    // ເຕະກັບໄປໜ້າ Dashboard
    return <Navigate to='/dashboard' replace />
  }

  // ຖ້າຜ່ານການກວດສອບ (ມີ Role ທີ່ຖືກຕ້ອງ) ກໍໃຫ້ເຂົ້າໜ້ານັ້ນໄດ້
  return <Outlet />
}

export { RoleRoute }