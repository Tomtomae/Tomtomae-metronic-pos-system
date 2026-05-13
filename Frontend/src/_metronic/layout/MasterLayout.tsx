import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AsideDefault } from './components/aside/AsideDefault'
import { ScrollTop } from './components/ScrollTop'
import { Content } from './components/Content'
import { PageDataProvider } from './core'
import { ActivityDrawer, DrawerMessenger, InviteUsers, UpgradePlan } from '../partials'
import { MenuComponent } from '../assets/ts/components'
import { Topbar } from './components/header/Topbar' 

const MasterLayout = () => {
  const location = useLocation()

  useEffect(() => {
    setTimeout(() => {
      MenuComponent.reinitialization()
    }, 500)
  }, [location.key])

  return (
    <PageDataProvider>
      <div className='d-flex flex-column flex-root'>
        <div className='page d-flex flex-row flex-column-fluid'>
          <AsideDefault />
          <div className='wrapper d-flex flex-column flex-row-fluid' id='kt_wrapper'>
            <div className='header align-items-stretch d-flex justify-content-between px-9 '
              style={{ 
                height: '65px', 
                borderBottom: '1px solid #eff2f5',
                background: '#fff',
                zIndex: 99
              }}
            >
              <div className='d-flex align-items-center'>
              </div> 
              <div className='d-flex align-items-stretch flex-shrink-0'>
                <Topbar />
              </div>
            </div>
            <div id='kt_content' className='content d-flex flex-column flex-column-fluid pt-10'>
              <Content>
                <Outlet />
              </Content>
            </div>

          </div>
        </div>
      </div>

      <ActivityDrawer />
      <DrawerMessenger />
      <InviteUsers />
      <UpgradePlan />
      <ScrollTop />
    </PageDataProvider>
  )
}

export { MasterLayout }