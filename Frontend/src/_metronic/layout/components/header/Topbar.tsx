import { FC } from 'react'
import { useLocation } from 'react-router-dom'
import { ThemeModeSwitcher } from '../../../partials'
import NotificationBell from '../../../../app/modules/Notification/NotificationBell'

const Topbar: FC = () => {
  const location = useLocation()
  const isProfilePage = location.pathname.includes('/profile')

  return (
    <div className='d-flex flex-shrink-0 align-items-center gap-2'>
      <NotificationBell />
      {!isProfilePage && (
        <div className='d-flex align-items-center ms-1'>
          <ThemeModeSwitcher toggleBtnClass='flex-center bg-body btn-color-gray-600 btn-active-color-primary h-40px' />
        </div>
      )}

    </div>
  )
}

export { Topbar }