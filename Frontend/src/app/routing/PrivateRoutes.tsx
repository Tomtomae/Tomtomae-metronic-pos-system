import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { MenuTestPage } from '../pages/MenuTestPage'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'
import PaidPage from '../modules/Receipts/componetReceiption/Paid'

const Quotation = lazy(() => import('../modules/Quotation/QuotationPage'))
const InvoicePage = lazy(() => import('../modules/Invoice/InvoicePage'))
const AccountPage = lazy(() => import('../modules/accounts/AccountPage'))
const ReceiptionPage = lazy(() => import('../modules/Receipts/ReceiptionPage'))
const ItemsServicesPage = lazy(() => import('../modules/ItemsServices/ItemsServicesPage'))
const CustomerPage = lazy(() => import('../modules/Customer/CustomerPage'))
const NotificationPage = lazy(()=> import('../modules/Notification/NotificationPage'))
const UsermanagementPage = lazy(() => import('../modules/UserManagement/Usermanagementpage'))
const TrashPage = lazy(() => import('../modules/Trachs/Trashpage'))
const PrivateRoutes = () => {

  return (
    <Routes>
      <Route element={<MasterLayout />}>
        {/* Redirect to Dashboard after success login/registartion */}
        <Route path='auth/*' element={<Navigate to='/dashboard' />} />
        {/* Pages */}
        <Route path='dashboard' element={<DashboardWrapper />} />
        <Route path='builder' element={<BuilderPageWrapper />} />
        <Route path='menu-test' element={<MenuTestPage />} />
        {/* Lazy Modules */}
        <Route
          path='quotation/*' 
          element={
            <SuspensedView>
              <Quotation />
            </SuspensedView>
          }
        />
        <Route
          path='Invoice/*'
          element={
            <SuspensedView>
              <InvoicePage />
            </SuspensedView>
          }
        />
        <Route
          path='Paid/*'
          element={
            <SuspensedView>
              <PaidPage />
            </SuspensedView>
          }
        />
        <Route
          path='crafted/Customer/*'
          element={
            <SuspensedView>
              <CustomerPage />
            </SuspensedView>
          }
        />
        <Route
          path='Receiption/*'
          element={
            <SuspensedView>
              <ReceiptionPage />
            </SuspensedView>
          }
        />
        <Route
          path='crafted/account/*'
          element={
            <SuspensedView>
              <AccountPage />
            </SuspensedView>
          }
        />
        <Route
          path='apps/items-services/*'
          element={
            <SuspensedView>
              <ItemsServicesPage />
            </SuspensedView>
          }
        />
        <Route
          path='apps/Notification/'
          element={
            <SuspensedView>
              <NotificationPage />
            </SuspensedView>
          }
        />
        <Route
          path='apps/UserManagement/'
          element={
            <SuspensedView>
              <UsermanagementPage />
            </SuspensedView>
          }
        />  
        <Route
          path='apps/Trash/'
          element={
            <SuspensedView>
              <TrashPage />
            </SuspensedView>
          }
        />
        <Route path='*' element={<Navigate to='/error/404' />} />
      </Route>
    </Routes>
  )
}

const SuspensedView: FC<WithChildren> = ({ children }) => {
  const baseColor = getCSSVariableValue('--bs-primary')
  TopBarProgress.config({
    barColors: {
      '0': baseColor,
    },
    barThickness: 1,
    shadowBlur: 5,
  })
  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
}

export { PrivateRoutes }
