
import React, { useEffect, useState } from 'react'
import { KTIcon, toAbsoluteUrl } from '../../../helpers'
import { UserModel } from '../../../../app/modules/auth/core/_models'
import axios from 'axios'

type Props = {
  className: string
}

const UsersApi = import.meta.env.VITE_APP_API_URL

const   TablesWidget9: React.FC<Props> = ({ className }) => {
  const [Users, setUsers] = useState<UserModel[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${UsersApi}/Users`)
        setUsers(response.data)
        setLoading(false)
      } catch (error) {
        console.log("can't fetch data")
        setLoading(false)

      }

    }

    fetchUser()
  }, [])
  return (
    <div className={`card ${className}`}>
      {/* begin::Header */}
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Members Statistics</span>
          <span className='text-muted mt-1 fw-semibold fs-7'>Over {Users.length} members</span>
        </h3>
        <div
          className='card-toolbar'
          data-bs-toggle='tooltip'
          data-bs-placement='top'
          data-bs-trigger='hover'
          title='Click to add a user'
        >
          <a
            href='#'
            className='btn btn-sm btn-light-primary'
            data-bs-toggle='modal'
            data-bs-target='#kt_modal_invite_friends'
          >
            <KTIcon iconName='plus' className='fs-3' />
            New Member
          </a>
        </div>
      </div>
      {/* end::Header */}
      {/* begin::Body */}
      <div className='card-body py-3'>
        {/* begin::Table container */}
        <div className='table-responsive scroll-y me-n5 pe-5' style={{maxHeight:'450px'}}>
          {/* begin::Table */}
          <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
            {/* begin::Table head */}
            <thead>
              <tr className='fw-bold text-muted '>
                <th className='w-25px'>
                  <div className='form-check form-check-sm form-check-custom form-check-solid'>
                    <input
                      className='form-check-input'
                      type='checkbox'
                      value='1'
                      data-kt-check='true'
                      data-kt-check-target='.widget-9-check'
                    />
                  </div>
                </th>
                <th className='min-w-150px'>Authors</th>
                <th className='min-w-140px'>Company</th>
                <th className='min-w-120px'>Progress</th>
                <th className='min-w-100px text-end'>Actions</th>
              </tr>
            </thead>
            {/* end::Table head */}
            {/* begin::Table body */}
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className='text-center'>Loading...</td></tr>
              ) : (
                Users.map((Item, index) => {
                  const randomId =(index % 30)+1
                  const avatarImg = Item.pic&& Item.pic != 'default.jpg' ? Item.pic:`300-${randomId}.jpg`

                  return(
                    <tr key={Item._id|| index}>
                      <td>
                        <div className='form-check form-check-sun for-check-custom form-check-solid'>
                          <input className='form-check-input' type='checkbox' value='1' />
                        </div>
                      </td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <div className='symbol symbol-45px me-5'>
                            <img src={toAbsoluteUrl(`media/avatars/${avatarImg}`)} alt="" />
                          </div>
                          <div className='d-flex justify-content-start flex-column'>
                            <a href="#" className='text-gray-900 fw-bold text-hover-primary fs-6'>
                              {Item.fullname || `${Item.first_name} ${Item.last_name}`}
                            </a>
                            <span className='text-muted fw-semibold d-block fs-7'>
                              {Item.occupation || 'Member'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href="#" className='text-gray-900 fw-bold  text-hover-primary d-block fs-6'>
                          {Item.companyName || 'Unknown'}
                        </a>
                        <span className='text-muted fw-semibold d-block fs-7'>
                          {Item.country || 'N/A'}
                        </span>
                      </td>
                      <td className='text-end'>
                        <div className='d-flex flex-column w-100 me-2'>
                          <div className='d-flex flex-stack mb-2'>
                            <span className='text-muted me-2 fs-7 fw-semibold'>50%</span>
                          </div>
                          <div className='progress h-px w-100'>
                            <div className='progress-br  bg-primary ' role= 'progressbar  ' style={{width:'50%'}}>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className='d-flex justify-content-end flex-shrink-0'>
                          <button className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
                            <KTIcon iconName='switch' className='fs-3' />
                          </button>
                          <button className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
                            <KTIcon iconName='pencil' className='fs-3' />
                          </button>
                          <button className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'>
                            <KTIcon iconName='trash' className='fs-3' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )
              }
            </tbody>
            {/* end::Table body */}
          </table>
          {/* end::Table */}
        </div>
        {/* end::Table container */}
      </div>
      {/* begin::Body */}
    </div>
  )
}

export { TablesWidget9 }
