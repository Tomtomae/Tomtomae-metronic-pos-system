import React, { useState } from 'react'
import { KTIcon } from '../../../../_metronic/helpers'
import Swal from 'sweetalert2' // 🌟 Import SweetAlert2

interface Props {
  show: boolean
  handleClose: () => void
  onSuccess: () => void
}

const CreateCustomerModal: React.FC<Props> = ({ show, handleClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  const initialForm = {
    paymentNo: `CUST-${Math.floor(1000 + Math.random() * 9000)}`, 
    name: '',
    email: '',
    taxId: '',
    paymentTerms: 'net30',
    contact: { name: '', phone: '' },
    address: { 
      village: '', 
      district: '', 
      province: '', 
      postCode: '' 
    }
  }

  const [formData, setFormData] = useState(initialForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 🌟 ໃຊ້ Environment Variable
      const apiUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api'

      const response = await fetch(`${apiUrl}/Customer/Create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData(initialForm)
        onSuccess() // ດຶງຂໍ້ມູນໃໝ່ ແລະ ປິດ Modal
        
        // 🌟 ແຈ້ງເຕືອນສຳເລັດ
        Swal.fire({
          title: 'ສຳເລັດ!',
          text: 'ເພີ່ມລູກຄ້າໃໝ່ສຳເລັດແລ້ວ.',
          icon: 'success',
          confirmButtonColor: '#50cd89',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        const err = await response.json()
        // 🌟 ແຈ້ງເຕືອນ Error ຈາກ Backend
        Swal.fire({
          title: 'ຜິດພາດ!',
          text: err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ',
          icon: 'error',
          confirmButtonColor: '#f1416c'
        })
      }
    } catch (error) {
      console.error(error)
      // 🌟 ແຈ້ງເຕືອນກໍລະນີເຊື່ອມຕໍ່ Server ບໍ່ໄດ້
      Swal.fire({
        title: 'ເຊື່ອມຕໍ່ລົ້ມເຫຼວ!',
        text: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບ Server ໄດ້, ກະລຸນາກວດສອບອິນເຕີເນັດ.',
        icon: 'warning',
        confirmButtonColor: '#f1416c'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <>
      <div className='modal fade show d-block' tabIndex={-1}>
        <div className='modal-dialog modal-dialog-centered mw-750px'>
          <div className='modal-content shadow-lg'>
            <div className='modal-header border-0 pb-0 justify-content-end'>
              <div className='btn btn-icon btn-sm btn-active-light-primary ms-2' onClick={handleClose}>
                <KTIcon iconName='cross' className='fs-1' />
              </div>
            </div>

            <form onSubmit={handleSubmit} className='form'>
              <div className='modal-body pt-0 pb-15 px-lg-17'>
                <div className='mb-13 text-center'>
                  <h1 className='mb-3'>ເພີ່ມລູກຄ້າໃໝ່</h1>
                  <div className='text-muted fw-semibold fs-5'>
                    ກະລຸນາປ້ອນຂໍ້ມູນລາຍລະອຽດຂອງລູກຄ້າໃຫ້ຄົບຖ້ວນ (ລະຫັດ: <span className='text-primary'>{formData.paymentNo}</span>)
                  </div>
                </div>

                <div className='scroll-y me-n7 pe-7' style={{ maxHeight: '600px' }}>
                  {/* --- Section 1: ຂໍ້ມູນພື້ນຖານ --- */}
                  <div className='d-flex flex-stack mb-5'>
                    <div className='me-5'>
                      <label className='fs-5 fw-bold'>ຂໍ້ມູນທົ່ວໄປ</label>
                    </div>
                  </div>
                  
                  <div className='fv-row mb-7'>
                    <label className='required fs-6 fw-semibold mb-2'>ຊື່ບໍລິສັດ / ລູກຄ້າ</label>
                    <input
                      type='text'
                      className='form-control form-control-lg form-control-solid'
                      placeholder='ຕົວຢ່າງ: ບໍລິສັດ ເອສຊີຈີ ຈຳກັດ'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className='row g-9 mb-7'>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-semibold mb-2'>ອີເມວຕິດຕໍ່</label>
                      <input
                        type='email'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='example@mail.com'
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className='col-md-6 fv-row'>
                      <label className='fs-6 fw-semibold mb-2'>ເລກປະຈຳຕົວຜູ້ເສຍພາສີ</label>
                      <input
                        type='text'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='ຖ້າມີ...'
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className='separator separator-dashed my-10'></div>

                  {/* --- Section 2: ຜູ້ຕິດຕໍ່ --- */}
                  <div className='d-flex flex-stack mb-5'>
                    <div className='me-5'>
                      <label className='fs-5 fw-bold text-primary'>
                        <KTIcon iconName='user' className='fs-2 me-2 text-primary' /> ຂໍ້ມູນຜູ້ຕິດຕໍ່
                      </label>
                    </div>
                  </div>

                  <div className='row g-9 mb-8'>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-semibold mb-2'>ຊື່ຜູ້ປະສານງານ</label>
                      <input
                        type='text'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='ຊື່ ແລະ ນາມສະກຸນ'
                        value={formData.contact.name}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          contact: { ...formData.contact, name: e.target.value } 
                        })}
                        required
                      />
                    </div>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-semibold mb-2'>ເບີໂທລະສັບ</label>
                      <input
                        type='text'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='020...'
                        value={formData.contact.phone}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          contact: { ...formData.contact, phone: e.target.value } 
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className='separator separator-dashed my-10'></div>

                  {/* --- Section 3: ທີ່ຢູ່ ແລະ ການຊຳລະ --- */}
                  <div className='d-flex flex-stack mb-5'>
                    <div className='me-5'>
                      <label className='fs-5 fw-bold text-success'>
                        <KTIcon iconName='geolocation' className='fs-2 me-2 text-success' /> ທີ່ຢູ່ ແລະ ເງື່ອນໄຂການຊຳລະ
                      </label>
                    </div>
                  </div>

                  <div className='row g-9 mb-7'>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-semibold mb-2'>ບ້ານ</label>
                      <input
                        type='text'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='ບ້ານ...'
                        value={formData.address.village}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, village: e.target.value } 
                        })}
                        required
                      />
                    </div>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-semibold mb-2'>ເມືອງ</label>
                      <input
                        type='text'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='ເມືອງ...'
                        value={formData.address.district}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, district: e.target.value } 
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className='row g-9 mb-7'>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-semibold mb-2'>ແຂວງ</label>
                      <input
                        type='text'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='ແຂວງ...'
                        value={formData.address.province}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, province: e.target.value } 
                        })}
                        required
                      />
                    </div>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-semibold mb-2'>ລະຫັດໄປສະນີ</label>
                      <input
                        type='text'
                        className='form-control form-control-lg form-control-solid'
                        placeholder='10000'
                        value={formData.address.postCode}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, postCode: e.target.value } 
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className='fv-row'>
                    <label className='fs-6 fw-semibold mb-2'>ເງື່ອນໄຂການຊຳລະ (Payment Terms)</label>
                    <select
                      className='form-select form-select-lg form-select-solid fw-bold'
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    >
                      <option value='net30'>Net 30 (30 ວັນ)</option>
                      <option value='net45'>Net 45 (45 ວັນ)</option>
                      <option value='net60'>Net 60 (60 ວັນ)</option>
                      <option value='net90'>Net 90 (90 ວັນ)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className='modal-footer flex-center'>
                <button type='reset' onClick={handleClose} className='btn btn-light me-3' disabled={loading}>
                  ຍົກເລີກ
                </button>
                <button type='submit' className='btn btn-primary' disabled={loading}>
                  {!loading && <span className='indicator-label'>ບັນທຶກຂໍ້ມູນ</span>}
                  {loading && (
                    <span className='indicator-progress' style={{ display: 'block' }}>
                      ກຳລັງບັນທຶກ...{' '}
                      <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className='modal-backdrop fade show'></div>
    </>
  )
}

export { CreateCustomerModal }