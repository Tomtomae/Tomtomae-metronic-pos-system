
import React, { useEffect, useState } from 'react'
import {KTIcon, toAbsoluteUrl} from '../../../helpers'
import {Dropdown1} from '../../content/dropdown/Dropdown1'
import { UserModel } from '../../../../app/modules/auth/core/_models'
import axios from 'axios'

type Props = {
  className: string
}

const APIUser = import.meta.env.VITE_APP_API_URL

const ListsWidget2: React.FC<Props> = ({className}) => {
  const [member , setMember] = useState<UserModel[]>([])
  const [loading,setLoading] = useState<boolean>(true)

  useEffect(()=>{
    const fetchUser =async ()=>{
      try{
        const response = await axios.get(`${APIUser}/users`)
        setMember(response.data)
        setLoading(false)
      }catch(error){
        console.log("can't not fetchUser")
        setLoading(false)

      }
    }
    fetchUser()
  },[])
  return (
    <div className={`card ${className}`}>
      {/* begin::Header */}
      <div className='card-header border-0'>
        <h3 className='card-title fw-bold text-gray-900'>Authors</h3>
        <div className='card-toolbar'>
          {/* begin::Menu */}
          <button
            type='button'
            className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
            data-kt-menu-trigger='click'
            data-kt-menu-placement='bottom-end'
            data-kt-menu-flip='top-end'
          >
            <KTIcon iconName='category' className='fs-2' />
          </button>
          <Dropdown1 />
          {/* end::Menu */}
        </div>
      </div>
      {/* end::Header */}
      {/* begin::Body */}
      <div className='card-body pt-2'>
        {loading? (
          <div className='text-center py-5 '>Loading...</div>
        ):member.length > 0 ?(
          member.slice(0,5).map((Item,index) =>{
            const randomId = (index % 30) +1 
            const avatarImg = Item.pic && Item.pic !== 'default.jpg'
            ?Item.pic:`300-${randomId}.jpg`

            return(
              <div className={`d-flex align-item-center ${index !== member.length -1 ? 'mb-7':''}`}key={Item._id || index}>
                <div className='symbol symbol-50px me-5'>
                  <img src={toAbsoluteUrl(`media/avatars/${avatarImg}`)} alt="" />
                </div>

                <div className='flex-grow-1'>

                  <a href="#" className='text-gray-900 fw-bo;;d text-hover-prinary fs-6'>
                    {Item.fullname ||  `${Item.first_name} ${Item.last_name}`}
                  </a>
                  <span className='text-muted d-block fw-semibold'>
                    {Item.occupation || 'Author'}
                  </span>
                </div>
              </div>
            )
          })
        ):(
          <div className='text-center py-5 text-muted'>No Authors found</div>
        )}
      </div>
      {/* end::Body */}
    </div>
  )
}

export {ListsWidget2}
