import React, { useState } from 'react'
import { KTIcon } from '../../../_metronic/helpers'
import { showToast } from '../../../utils/toastAlert'

type TrashTab = 'users' | 'docs' | 'finance'

const TrashPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrashTab>('users')

  return (
    <div className='d-flex flex-column gap-6 p-2' style={{ backgroundColor: '#fcfdfc' }}>
      
      {/* ── Page Header ── */}
      <div className='d-flex align-items-center justify-content-between'>
        <div className='card-title flex-column'>
          <h1 className='fw-black text-gray-900 fs-2 mb-0 text-uppercase letter-spacing-1'>Trash & Archive System</h1>
          <p className='text-muted fs-9 fw-bold text-uppercase mt-1'>Managed Historical Data Restoration</p>
        </div>
        <div className='badge badge-light-danger fw-black px-4 py-3 rounded-1 border border-danger border-dashed fs-9'>
          AUTO-PURGE: 30 DAYS
        </div>
      </div>

      {/* ── Main Tabbed Card ── */}
      <div className='card border border-gray-200 shadow-none rounded-1 bg-white overflow-hidden'>
        <div className='card-header border-bottom border-gray-100 min-h-auto pt-5 px-8'>
          <ul className='nav nav-tabs nav-line-tabs nav-stretch fs-8 fw-black text-uppercase border-0'>
            <li className='nav-item'>
              <a className={`nav-link text-active-success py-4 px-6 border-active-success border-bottom-3 cursor-pointer ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                <KTIcon iconName='people' className='fs-4 me-2' /> ພະນັກງານ
              </a>
            </li>
            <li className='nav-item'>
              <a className={`nav-link text-active-success py-4 px-6 border-active-success border-bottom-3 cursor-pointer ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
                <KTIcon iconName='document' className='fs-4 me-2' /> ໃບສະເໜີລາຄາ
              </a>
            </li>
            <li className='nav-item'>
              <a className={`nav-link text-active-success py-4 px-6 border-active-success border-bottom-3 cursor-pointer ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
                <KTIcon iconName='vault' className='fs-4 me-2' /> ປະຫວັດການເງິນ
              </a>
            </li>
          </ul>
        </div>

        <div className='card-body p-8'>
          <div className='table-responsive'>
            <table className='table align-middle table-row-bordered fs-8 gy-5 mb-0'>
              <thead>
                <tr className='text-start text-gray-400 fw-black text-uppercase gs-0 border-bottom-2 border-emerald-50'>
                  <th className='ps-2'>ລາຍລະອຽດຂໍ້ມູນ / ID</th>
                  <th>ສາເຫດການລຶບ</th>
                  <th>ວັນທີລຶບ</th>
                  <th className='text-end pe-2'>Audit Control</th>
                </tr>
              </thead>
              <tbody className='fw-bold text-gray-700'>
                {/* Example Row (Technical Industrial Style) */}
                <tr className='bg-hover-light-soft transition-all'>
                  <td className='ps-2'>
                    <div className='d-flex align-items-center'>
                      <div className='symbol symbol-35px me-4'>
                        <div className='symbol-label bg-light-success text-success fw-black rounded-1 border border-emerald-100'>QT</div>
                      </div>
                      <div className='d-flex flex-column'>
                        <span className='text-gray-900 fw-black fs-7 mb-0'>QT-2026-9902</span>
                        <span className='text-muted fs-9 font-monospace uppercase'>Lao Tech Development Co.</span>
                      </div>
                    </div>
                  </td>
                  <td><span className='badge badge-light-warning fw-bold fs-9 rounded-1 px-3 py-2'>EXPIRED DRAFT</span></td>
                  <td><span className='font-monospace fw-bold text-gray-600'>12 MAY 2026</span></td>
                  <td className='text-end pe-0'>
                    <button className='btn btn-sm btn-light-success fw-black rounded-1 px-6 me-2' onClick={() => showToast('success', 'ກູ້ຄືນຂໍ້ມູນສຳເລັດ')}>ກູ້ຄືນ</button>
                    {activeTab !== 'finance' && (
                      <button className='btn btn-icon btn-sm btn-light-danger border-gray-200 rounded-1' onClick={() => showToast('success', 'ລຶບຖາວອນແລ້ວ')}><KTIcon iconName='trash' className='fs-4' /></button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className='card border border-danger border-dashed shadow-none rounded-1 bg-light-danger bg-opacity-10'>
        <div className='card-body py-6 px-9 d-flex align-items-center justify-content-between'>
          <div className='d-flex align-items-center gap-5'>
            <div className='w-40px h-40px bg-danger rounded-1 d-flex align-items-center justify-content-center text-white'>
              <KTIcon iconName='warning-2' className='fs-2 text-white' />
            </div>
            <div>
              <h4 className='fw-black text-danger fs-5 mb-1 text-uppercase letter-spacing-1'>ລຶບລ້າງຂໍ້ມູນຖາວອນ (System Purge)</h4>
              <p className='text-muted fs-9 fw-bold mb-0 uppercase'> Irreversible destruction of documents older than 30 days.</p>
            </div>
          </div>
          <button className='btn btn-danger btn-sm fw-black px-10 rounded-1' onClick={() => showToast('success', 'ກຳລັງເລີ່ມຕົ້ນລຶບລ້າງ...')}>
            <KTIcon iconName='trash' className='fs-4 me-2' /> START CLEANUP
          </button>
        </div>
      </div>

    </div>
  )
}

export default TrashPage