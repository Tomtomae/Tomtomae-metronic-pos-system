import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { KTIcon } from '../../../../helpers'
import { useAuth } from '../../../../../app/modules/auth'

const TabsBase: FC = () => {
  const location = useLocation()
  const { currentUser } = useAuth()


  const isAdmin = currentUser?.role === 'admin'

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className='d-flex h-150 flex-column'>
      <div
        className='flex-column-fluid hover-scroll-y'
        data-kt-scroll='true'
        data-kt-scroll-activate='true'
        data-kt-scroll-height='auto'
        data-kt-scroll-wrappers='#kt_aside_wordspace'
        data-kt-scroll-offset='0px'
      >
        <div className='tab-content'>
          <div className='tab-pane fade active show' role='tabpanel'>
            <div className='menu menu-column menu-fit menu-rounded menu-title-gray-600 menu-state-primary fw-bold fs-6 px-3 pt-15'>

              {/* 🟢 ເມນູນີ້ເຫັນທຸກຄົນ (Admin & Employee) */}
              <div className='menu-item mb-4'>
                <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/dashboard') })} to='/dashboard'>
                  <span className='menu-icon me-3'><KTIcon iconName='element-11' className='fs-2' /></span>
                  <span className='menu-title fs-6'>ໜ້າຫຼັກ</span>
                </Link>
              </div>

              <div className='menu-item mb-4'>
                <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/quotation') })} to='/quotation'>
                  <span className='menu-icon me-3'><KTIcon iconName='abstract-26' className='fs-2' /></span>
                  <span className='menu-title fs-6'>ໃບສະເໜີລາຄາ</span>
                </Link>
              </div>

              <div className='menu-item mb-4'>
                <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/Invoice') })} to='/Invoice'>
                  <span className='menu-icon me-3'><KTIcon iconName='bill' className='fs-2' /></span>
                  <span className='menu-title fs-6'>ໃບແຈ້ງໜີ້</span>
                </Link>
              </div>

              {/* 🔴 ເຫັນສະເພາະ ADMIN (ໃບຮັບເງິນ / Receipts) */}
              {isAdmin && (
                <div className='menu-item mb-4'>
                  <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/Receiption') })} to='/Receiption'>
                    <span className='menu-icon me-3'><KTIcon iconName='wallet' className='fs-2' /></span>
                    <span className='menu-title fs-6'>ໃບຮັບເງິນ</span>
                  </Link>
                </div>
              )}

              <div className='menu-item mb-4'>
                <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/Paid') })} to='/Paid'>
                  <span className='menu-icon me-3'><KTIcon iconName='bill' className='fs-2' /></span>
                  <span className='menu-title fs-6'>ລາຍການຊຳລະ</span>
                </Link>
              </div>

              <div className='menu-item mb-4'>
                <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/crafted/Customer') })} to='/crafted/Customer'>
                  <span className='menu-icon me-3'><KTIcon iconName='profile-circle' className='fs-2' /></span>
                  <span className='menu-title fs-6'>ລູກຄ້າ</span>
                </Link>
              </div>

              {isAdmin && (
                <div className='menu-item mb-4'>
                  <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/apps/items-services') })} to='/apps/items-services'>
                    <span className='menu-icon me-3'><KTIcon iconName='handcart' className='fs-2' /></span>
                    <span className='menu-title fs-6'>ສິນຄ້າ ແລະ ບໍລິການ</span>
                  </Link>
                </div>
              )}

              <div className='menu-item mb-4'>
                <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('/crafted/account') })} to='/crafted/account'>
                  <span className='menu-icon me-3'><KTIcon iconName='profile-circle' className='fs-2' /></span>
                  <span className='menu-title fs-6'>ຂໍ້ມູນບັນຊີ</span>
                </Link>
              </div>

              {isAdmin && (
                <div className='menu-item mb-4'>
                  <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('apps/UserManagement/') })} to='/apps/UserManagement/'>
                    <span className='menu-icon me-3'><KTIcon iconName='setting-2' className='fs-2' /></span>
                    <span className='menu-title fs-6'>ຈັດການພະນັກງານ</span>
                  </Link>
                </div>
              )}
              {/* 🔔 Notifications — ເຫັນທຸກ Role */}
              <div className='menu-item mb-4'>
                <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('apps/Notification/') })} to='apps/Notification/'>
                  <span className='menu-icon me-3'><KTIcon iconName='notification' className='fs-2' /></span>
                  <span className='menu-title fs-6'>ແຈ້ງເຕືອນ</span>
                </Link>
              </div>

              {/* 🗑 Trash — Admin only */}
              {isAdmin && (
                <div className='menu-item mb-4'>
                  <Link className={clsx('menu-link py-4 px-4 rounded-3', { active: isActive('apps/Trash/') })} to='apps/Trash/'>
                    <span className='menu-icon me-3'><KTIcon iconName='trash' className='fs-2' /></span>
                    <span className='menu-title fs-6'>ຖັງຂີ້ເຫຍື້ອ</span>
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { TabsBase }