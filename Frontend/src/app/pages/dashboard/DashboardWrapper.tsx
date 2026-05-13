import React from 'react'
import { useIntl } from 'react-intl'
import { PageLink, PageTitle } from '../../../_metronic/layout/core'
import {
  ListsWidget4,
  TablesWidget9,
  TablesWidget5,
  StatisticsWidget4,
  StatisticsWidget1,
} from '../../../_metronic/partials/widgets'


const dashboardBreadCrumbs: Array<PageLink> = [
  {
    title: 'Home',
    path: '/dashboard',
    isSeparator: false,
    isActive: false,
  },
]

const DashboardPage: React.FC = () => {

  return (
    <div style={{ marginTop: '10px' }}>
      <div className='row g-5 g-xl-8'>
        <div className='col-xl-3 col-md-6'>
          <StatisticsWidget1
            className='card-xl-stretch mb-xl-8'
            svgIcon='basket'
            color='success'
            description='ໃບສະເໜີລາຄາທັງໝົດ'
            dataType='quotation'
          />
        </div>
        <div className='col-xl-3 col-md-6'>
          <StatisticsWidget1
            className='card-xl-stretch mb-xl-8'
            svgIcon='cheque'
            color='primary'
            description='ໃບແຈ້ງໜີ້ທັງໝົດ'
            dataType='invoice'
          />
        </div>
        <div className='col-xl-3 col-md-6'>
          <StatisticsWidget1
            className='card-xl-stretch mb-xl-8'
            svgIcon='chart-simple-3'
            color='info'
            description='ລາຍຮັບທີ່ໄດ້ຮັບແລ້ວ'
            dataType='income'
          />
        </div>
        <div className='col-xl-3 col-md-6'>
          <StatisticsWidget4
            className='card-xl-stretch mb-xl-8'
            svgIcon='plus-square'
            color='warning'
            description='ຈຳນວນລູກຄ້າ'
          />
        </div>
      </div>

      {/* ─── ໂຊນທີ 2: ຕາຕະລາງທຸລະກຳຫຼ້າສຸດ (Full Width) ─── */}
      <div className='row g-5 g-xl-8'>
        <div className='col-xxl-12'>
          <TablesWidget9 className='card-xxl-stretch mb-5 mb-xl-8' />
        </div>
      </div>

      {/* ─── ໂຊນທີ 3: ສະຫຼຸບສະຖານະ ແລະ ລູກຄ້າດີເດັ່ນ ─── */}
      <div className='row g-5 g-xl-8'>
        <div className='col-xxl-8 col-xl-7'>
          <TablesWidget5 className='card-xxl-stretch mb-5 mb-xl-8' />
        </div>
        <div className='col-xxl-4 col-xl-5'>
          <ListsWidget4 className='card-xxl-stretch mb-5 mb-xl-8' items={5} />
        </div>
      </div>
    </div>
  )
}

const DashboardWrapper: React.FC = () => {
  const intl = useIntl()

  return (
    <>
      <PageTitle breadcrumbs={dashboardBreadCrumbs}>
        {intl.formatMessage({ id: 'MENU.DASHBOARD' })}
      </PageTitle>
      <DashboardPage />
    </>
  )
}

export { DashboardWrapper }