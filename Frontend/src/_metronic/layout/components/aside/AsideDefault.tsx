import {FC} from 'react'
import {Link} from 'react-router-dom'
import clsx from 'clsx'
import {useLayout} from '../../core'
import {KTIcon, toAbsoluteUrl} from '../../../helpers'
import {TabsBase} from './Tabs/_TabsBase'
import {useAuth} from '../../../../app/modules/auth/core/Auth'

const AsideDefault: FC = () => {
  const {config, classes} = useLayout()
  const {currentUser, logout} = useAuth()

  // 🛠️ ຟັງຊັນຈັດການຮູບພາບ (ໃຊ້ picUrl ທີ່ Backend ສົ່ງມາໃຫ້ເລີຍ)
  const getUserPic = (): string => {
    // 1. ຖ້າມີ picUrl (ເຊິ່ງເປັນ URL ເຕັມຈາກ Backend) ໃຫ້ໃຊ້ຄ່ານັ້ນກ່ອນ
    if (currentUser?.picUrl) {
      return currentUser.picUrl
    }

    // 2. ຖ້າບໍ່ມີ picUrl ແຕ່ມີ pic (ເປັນ Path)
    if (currentUser?.pic) {
      // ກໍລະນີ pic ເປັນ http ຢູ່ແລ້ວ
      if (currentUser.pic.startsWith('http')) return currentUser.pic
      
      // ຖ້າເປັນ Path ທຳມະດາ ໃຫ້ຊີ້ໄປທີ່ Port 5000 (Fallback)
      const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000'
      const cleanPath = currentUser.pic.replace(/^\//, '')
      return `${API_URL}/${cleanPath}`
    }

    // 3. ຖ້າບໍ່ມີຂໍ້ມູນເລີຍ ໃຫ້ໃຊ້ຮູບຫວ່າງ
    return toAbsoluteUrl('media/avatars/blank.png')
  }

  return (
    <div
      id='kt_aside'
      className={clsx('aside aside-extended', classes.aside.join(' '))}
      data-kt-drawer='true'
      data-kt-drawer-name='aside'
      data-kt-drawer-activate='{default: true, lg: false}'
      data-kt-drawer-overlay='true'
      data-kt-drawer-width='auto'
      data-kt-drawer-direction='start'
      data-kt-drawer-toggle='#kt_aside_toggle'
    >
      {/* begin::Primary */}
      <div className='aside-primary d-flex flex-column align-items-lg-center flex-row-auto'>
        {/* begin::Logo */}
        <div className='aside-logo d-none d-lg-flex flex-column align-items-center flex-column-auto py-10'>
          <Link to='/dashboard'>
            <img src={toAbsoluteUrl('media/logos/demo7.svg')} alt='logo' className='h-35px' />
          </Link>
        </div>

        {/* begin::Nav (ບ່ອນລວມເມນູ) */}
        <div className='aside-nav d-flex flex-column align-items-center flex-column-fluid w-100 pt-5 pt-lg-0'>
          {/* ທ່ານສາມາດໃສ່ເມນູອື່ນໆ ຢູ່ບ່ອນນີ້ */}
        </div>

        {/* 🌟 Footer Section: Profile & Logout 🌟 */}
        <div className='aside-footer d-flex flex-column align-items-center flex-column-auto py-7'>
          
          {/* ຮູບໂປຣໄຟລ໌ວົງກົມ */}
          <div className='mb-5'>
            {/* 🔗 Link ໄປຫາ crafted/account/overview ຕາມທີ່ຕັ້ງໄວ້ໃນ PrivateRoutes */}
            <Link to='/crafted/account/overview'>
              <img 
                src={getUserPic()} 
                alt='Profile' 
                className='h-40px w-40px rounded-circle object-fit-cover shadow-sm' 
                style={{ border: '2px solid #fff' }}
                onError={(e) => {
                  // ຖ້າ URL ຜິດພາດ ໃຫ້ໃຊ້ຮູບ Blank
                  (e.target as HTMLImageElement).src = toAbsoluteUrl('media/avatars/blank.png')
                }}
              />
            </Link>
          </div>

          {/* ປຸ່ມ Logout */}
          <a
            onClick={(e) => {
              e.preventDefault()
              logout() 
            }} 
            className='btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-danger'
            title='Logout'
            style={{ cursor: 'pointer' }}
          >
            <KTIcon iconName='exit-right' className='fs-2' />
          </a>

        </div>
      </div>

      {/* begin::Secondary */}
      {config.aside.secondaryDisplay && (
        <div className='aside-secondary d-flex flex-row-fluid'>
          <div className='aside-workspace my-5 p-5'>
            <TabsBase />
          </div>
        </div>
      )}

      {/* ปุ่ม Toggle */}
      <button
        id='kt_aside_toggle'
        className={clsx(
          'btn btn-sm btn-icon bg-body btn-color-gray-700 btn-active-primary position-absolute translate-middle start-100 end-0 bottom-0 shadow-sm d-none d-lg-flex',
          classes.asideToggle.join(' ')
        )}
        data-kt-toggle='true'
        data-kt-toggle-state='active'
        data-kt-toggle-target='body'
        data-kt-toggle-name='aside-minimize'
        style={{marginBottom: '1.35rem'}}
      >
        <KTIcon iconName='arrow-left' className='fs-2 rotate-180' />
      </button>
    </div>
  )
}

export {AsideDefault}