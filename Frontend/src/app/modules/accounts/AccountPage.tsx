import React, {useState, useRef} from 'react'
import {useAuth} from '../auth'
import {KTIcon, KTCard, KTCardBody, ID} from '../../../_metronic/helpers' // ✅ Import ID ມາໃຊ້
import {UpdateUser} from '../auth/core/_requests'
import {toastAlert} from '../../../utils/toastAlert'
import {useFormik} from 'formik'
import * as Yup from 'yup'
import clsx from 'clsx'

// --- ກຳນົດ Interface ສຳລັບ Form (Strict Type - No Any) ---
interface ProfileFormValues {
  first_name: string
  last_name: string
  phone: string
  companyName: string
  taxId: string
  website: string
  country: string
  currency: 'LAK' | 'THB' | 'USD'
  language: 'en' | 'lo' | 'th'
  addressLine: string
  city: string
  state: string
  postCode: string
  emailNotification: boolean
  sendCopyToPersonalEmail: boolean
}

const profileSchema = Yup.object().shape({
  first_name: Yup.string().required('ກະລຸນາປ້ອນຊື່'),
  last_name: Yup.string().required('ກະລຸນາປ້ອນນາມສະກຸນ'),
})

const AccountPage: React.FC = () => {
  const {currentUser, setCurrentUser, auth} = useAuth()
  const [loading, setLoading] = useState<boolean>(false)
  const [picPreview, setPicPreview] = useState<string | null>(null)
  const [picFile, setPicFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const formik = useFormik<ProfileFormValues>({
    initialValues: {
      first_name: currentUser?.first_name || '',
      last_name: currentUser?.last_name || '',
      phone: currentUser?.phone || '',
      companyName: currentUser?.companyName || '',
      taxId: currentUser?.taxId || '',
      website: currentUser?.website || '',
      country: currentUser?.country || 'LA',
      currency: (currentUser?.currency as 'LAK' | 'THB' | 'USD') || 'LAK',
      language: (currentUser?.language as 'en' | 'lo' | 'th') || 'lo',
      addressLine: currentUser?.address?.addressLine || '',
      city: currentUser?.address?.city || '',
      state: currentUser?.address?.state || '',
      postCode: currentUser?.address?.postCode || '',
      emailNotification: currentUser?.settings?.emailNotification ?? true,
      sendCopyToPersonalEmail: currentUser?.settings?.sendCopyToPersonalEmail ?? false,
    },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('first_name', values.first_name)
        formData.append('last_name', values.last_name)
        formData.append('phone', values.phone)
        formData.append('companyName', values.companyName)
        formData.append('taxId', values.taxId)
        formData.append('website', values.website)
        formData.append('country', values.country)
        formData.append('currency', values.currency)
        formData.append('language', values.language)
        
        // ສົ່ງຂໍ້ມູນເປັນ JSON string ໃຫ້ Backend (ຕາມ Schema ຂອງ IUser)
        formData.append('address', JSON.stringify({
          addressLine: values.addressLine,
          city: values.city,
          state: values.state,
          postCode: values.postCode
        }))
        
        formData.append('settings', JSON.stringify({
          emailNotification: values.emailNotification,
          sendCopyToPersonalEmail: values.sendCopyToPersonalEmail
        }))

        if (picFile) formData.append('pic', picFile)

        const userId = (currentUser?._id || currentUser?.id || '') as ID
        
        const updatedUser = await UpdateUser(
          userId, 
          formData, 
          auth?.api_token || ''
        )
        
        if (updatedUser && setCurrentUser) {
          setCurrentUser(updatedUser)
          toastAlert('ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ!', 'success')
        } else {
          toastAlert('ບໍ່ສາມາດອັບເດດຂໍ້ມູນໄດ້', 'error')
        }
      } catch (error: unknown) {
        toastAlert('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່', 'error')
      } finally {
        setLoading(false)
      }
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPicFile(file)
      setPicPreview(URL.createObjectURL(file))
    }
  }

  return (
    <>
      {/* Summary Header */}
      <div className='card mb-5 mb-xl-10 shadow-sm'>
        <div className='card-body pt-9 pb-0'>
          <div className='d-flex flex-wrap flex-sm-nowrap mb-3'>
            <div className='me-7 mb-4'>
              <div className='symbol symbol-100px symbol-lg-160px symbol-fixed position-relative'>
                <img 
                  src={picPreview || currentUser?.picUrl || '/media/avatars/blank.png'} 
                  alt='User' 
                  className='object-cover'
                />
              </div>
            </div>
            <div className='flex-grow-1'>
              <div className='d-flex justify-content-between align-items-start flex-wrap mb-2'>
                <div className='d-flex flex-column'>
                  <div className='d-flex align-items-center mb-2'>
                    <span className='text-gray-900 fs-2 fw-bolder me-1'>
                      {currentUser?.first_name} {currentUser?.last_name}
                    </span>
                    <span className='badge badge-light-primary fw-bolder ms-2 px-3 py-1 text-uppercase'>
                      {currentUser?.role}
                    </span>
                  </div>
                  <div className='fw-bold fs-6 mb-4 pe-2 text-gray-400'>
                    <KTIcon iconName='sms' className='fs-4 me-1' /> {currentUser?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Settings */}
      <KTCard>
        <div className='card-header border-0'>
          <div className='card-title m-0'><h3 className='fw-bolder m-0'>ຕັ້ງຄ່າຂໍ້ມູນສ່ວນຕົວ</h3></div>
        </div>
        <div className='collapse show'>
          <form onSubmit={formik.handleSubmit} noValidate className='form'>
            <KTCardBody className='border-top p-9'>
              
              {/* Image Input */}
              <div className='row mb-6'>
                <label className='col-lg-4 col-form-label fw-bold fs-6'>ຮູບໂປຣໄຟລ໌</label>
                <div className='col-lg-8'>
                  <div className='image-input image-input-outline' style={{backgroundImage: 'url(/media/avatars/blank.png)'}}>
                    <div className='image-input-wrapper w-125px h-125px' style={{backgroundImage: `url(${picPreview || currentUser?.picUrl || '/media/avatars/blank.png'})`}}></div>
                    <label className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow' onClick={() => fileRef.current?.click()}>
                      <i className='bi bi-pencil-fill fs-7'></i>
                    </label>
                    <input type='file' ref={fileRef} className='d-none' accept='.png, .jpg, .jpeg' onChange={handleImageChange} />
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className='row mb-6'>
                <label className='col-lg-4 col-form-label required fw-bold fs-6'>ຊື່ ແລະ ນາມສະກຸນ</label>
                <div className='col-lg-8'>
                  <div className='row'>
                    <div className='col-lg-6 fv-row'>
                      <input type='text' className={clsx('form-control form-control-lg form-control-solid mb-3 mb-lg-0', {'is-invalid': formik.touched.first_name && formik.errors.first_name})} placeholder='ຊື່' {...formik.getFieldProps('first_name')} />
                    </div>
                    <div className='col-lg-6 fv-row'>
                      <input type='text' className={clsx('form-control form-control-lg form-control-solid', {'is-invalid': formik.touched.last_name && formik.errors.last_name})} placeholder='ນາມສະກຸນ' {...formik.getFieldProps('last_name')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className='row mb-6'>
                <label className='col-lg-4 col-form-label fw-bold fs-6'>ທີ່ຢູ່ (Address)</label>
                <div className='col-lg-8'>
                  <input type='text' className='form-control form-control-lg form-control-solid mb-3' placeholder='ບ້ານ, ຖະໜົນ' {...formik.getFieldProps('addressLine')} />
                  <div className='row'>
                    <div className='col-lg-4'><input type='text' className='form-control form-control-lg form-control-solid mb-3 mb-lg-0' placeholder='ເມືອງ' {...formik.getFieldProps('city')} /></div>
                    <div className='col-lg-4'><input type='text' className='form-control form-control-lg form-control-solid mb-3 mb-lg-0' placeholder='ແຂວງ' {...formik.getFieldProps('state')} /></div>
                    <div className='col-lg-4'><input type='text' className='form-control form-control-lg form-control-solid' placeholder='ລະຫັດໄປສະນີ' {...formik.getFieldProps('postCode')} /></div>
                  </div>
                </div>
              </div>

              {/* Currency & Language */}
              <div className='row mb-6'>
                <label className='col-lg-4 col-form-label fw-bold fs-6'>ສະກຸນເງິນ & ພາສາ</label>
                <div className='col-lg-8'>
                  <div className='row'>
                    <div className='col-lg-6 fv-row'>
                      <select className='form-select form-select-lg form-select-solid' {...formik.getFieldProps('currency')}>
                        <option value='LAK'>LAK (₭)</option>
                        <option value='THB'>THB (฿)</option>
                        <option value='USD'>USD ($)</option>
                      </select>
                    </div>
                    <div className='col-lg-6 fv-row'>
                      <select className='form-select form-select-lg form-select-solid' {...formik.getFieldProps('language')}>
                        <option value='lo'>ພາສາລາວ</option>
                        <option value='en'>English</option>
                        <option value='th'>ไทย</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className='row mb-0'>
                <label className='col-lg-4 col-form-label fw-bold fs-6'>ການແຈ້ງເຕືອນ</label>
                <div className='col-lg-8 d-flex align-items-center'>
                  <div className='form-check form-check-solid form-switch fv-row'>
                    <input className='form-check-input w-45px h-30px' type='checkbox' checked={formik.values.emailNotification} onChange={() => formik.setFieldValue('emailNotification', !formik.values.emailNotification)} />
                  </div>
                  <span className='fw-bold ps-3 text-gray-700'>ຮັບການແຈ້ງເຕືອນຜ່ານ Email</span>
                </div>
              </div>
            </KTCardBody>

            <div className='card-footer d-flex justify-content-end py-6 px-9'>
              <button type='submit' className='btn btn-primary px-10 fw-bolder' disabled={loading}>
                {!loading ? 'ບັນທຶກການປ່ຽນແປງ' : <span className='indicator-progress' style={{display: 'block'}}>ກຳລັງປະມວນຜົນ... <span className='spinner-border spinner-border-sm ms-2'></span></span>}
              </button>
            </div>
          </form>
        </div>
      </KTCard>
    </>
  )
}

export default AccountPage