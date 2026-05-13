import React, { useState, useEffect, ChangeEvent } from 'react'
import { Modal } from 'react-bootstrap'
import { KTIcon } from '../../../../_metronic/helpers'
import { ItemModel } from './ItemModel'
import axios, { AxiosError } from 'axios'
import Swal from 'sweetalert2' // 🌟 1. Import Swal

const API_URL = import.meta.env.VITE_APP_API_URL
export const Create_ItemServices = `${API_URL}/itemServices`

interface Props {
  show: boolean
  handleClose: () => void
  onSave: (data: ItemModel) => void
  editData?: ItemModel | null
}

interface ApiResponse {
  message: string
  item: ItemModel
}

const initialState: ItemModel = {
    ItemCode: '',
    Iname: '',
    description: '',
    category: 'General',
    type: 'Product',
    unit: 'Item',
    currency: 'LAK',
    costPrice: 0,
    price: 0,
    taxRate: 0, 
    status: 'Active'
  }

const AddItemModal: React.FC<Props> = ({ show, handleClose, onSave, editData }) => {


  const [loading, setLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState<ItemModel>(initialState)

  useEffect(() => {
    if (show) {
      if (editData) {
        setFormData({ ...initialState, ...editData })
      } else {
        setFormData(initialState)
      }
    }
  }, [show, editData])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ['price', 'taxRate', 'costPrice'].includes(name) ? Number(value) : value,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.Iname.trim() || !formData.ItemCode.trim()) {
      // 🌟 2. ປ່ຽນ Alert ເປັນ Swal
      Swal.fire({
        title: 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ',
        text: 'ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບຖ້ວນ (ລະຫັດ ແລະ ຊື່ລາຍການ)',
        icon: 'warning',
        confirmButtonColor: '#f1416c'
      });
      return
    }

    try {
      setLoading(true)

      if (editData && editData.ItemCode) {
        const response = await axios.put<ApiResponse>(`${API_URL}/itemServices/${editData.ItemCode}`, formData)
        onSave(response.data.item)
        Swal.fire({ title: 'ສຳເລັດ!', text: 'ແກ້ໄຂຂໍ້ມູນລາຍການສຳເລັດແລ້ວ', icon: 'success', confirmButtonColor: '#50cd89', timer: 2000, showConfirmButton: false });
      } else {
        const response = await axios.post<ApiResponse>(Create_ItemServices, formData)
        onSave(response.data.item)
        Swal.fire({ title: 'ສຳເລັດ!', text: 'ເພີ່ມລາຍການໃໝ່ສຳເລັດແລ້ວ', icon: 'success', confirmButtonColor: '#50cd89', timer: 2000, showConfirmButton: false });
      }
      
      handleClose()
    } catch (error: unknown) {
      console.error('ເກີດຂໍ້ຜິດພາດ:', error)
      
      let errorMessage = 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້, ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ອິນເຕີເນັດ ຫຼື API';
      
      if (axios.isAxiosError(error)) {
        const serverError = error as AxiosError<{ message: string }>;
        errorMessage = serverError.response?.data?.message || 'ເກີດຂໍ້ຜິດພາດຈາກເຊີບເວີ';
      } else if (error instanceof Error) {
        errorMessage = `ເກີດຂໍ້ຜິດພາດ: ${error.message}`;
      }
      
      // 🌟 ແຈ້ງເຕືອນ Error ດ້ວຍ Swal
      Swal.fire({
        title: 'ຜິດພາດ!',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#f1416c'
      });

    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={handleClose} size='lg' centered backdrop="static">
      <div className='modal-header bg-light'>
        <h2 className='fw-bolder mb-0'>
          {editData ? 'ແກ້ໄຂຂໍ້ມູນລາຍການ' : 'ເພີ່ມສິນຄ້າ ຫຼື ບໍລິການໃໝ່'}
        </h2>
        <div className='btn btn-icon btn-sm btn-active-light-danger' onClick={handleClose}>
          <KTIcon iconName='cross' className='fs-1' />
        </div>
      </div>

      <div className='modal-body py-10 px-lg-17'>
        <div className='scroll-y me-n7 pe-7'>
          
          <h4 className="text-dark fw-bold mb-7 border-bottom pb-3">1. ຂໍ້ມູນພື້ນຖານ (Basic Information)</h4>
          
          <div className='row g-9 mb-7'>
            <div className='col-md-6 fv-row'>
              <label className='required fs-6 fw-semibold mb-2'>ລະຫັດລາຍການ (SKU)</label>
              <input
                type='text'
                name='ItemCode'
                className='form-control form-control-solid'
                value={formData.ItemCode}
                onChange={handleChange}
                placeholder='P-001'
                disabled={!!editData} 
              />
            </div>
            <div className='col-md-6 fv-row'>
              <label className='required fs-6 fw-semibold mb-2'>ຊື່ລາຍການ (Item Name)</label>
              <input
                type='text'
                name='Iname'
                className='form-control form-control-solid'
                value={formData.Iname}
                onChange={handleChange}
                placeholder='ປ້ອນຊື່ສິນຄ້າ ຫຼື ບໍລິການ...'
              />
            </div>
          </div>

          <div className='row g-9 mb-7'>
            <div className='col-md-6 fv-row'>
              <label className='required fs-6 fw-semibold mb-2'>ປະເພດ (Type)</label>
              <select
                name='type'
                className='form-select form-select-solid'
                value={formData.type}
                onChange={handleChange}
              >
                <option value='Product'>ສິນຄ້າ (Product)</option>
                <option value='Service'>ບໍລິການ (Service)</option>
              </select>
            </div>
            <div className='col-md-6 fv-row'>
              <label className='fs-6 fw-semibold mb-2'>ໝວດໝູ່ (Category)</label>
              <input
                type='text'
                name='category'
                className='form-control form-control-solid'
                value={formData.category}
                onChange={handleChange}
                placeholder='ເຊັ່ນ: ເຄື່ອງດື່ມ, ອາໄຫຼ່...'
              />
            </div>
          </div>

          <div className='fv-row mb-10'>
            <label className='fs-6 fw-semibold mb-2'>ລາຍລະອຽດ (Description)</label>
            <textarea
              name='description'
              className='form-control form-control-solid'
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder='ອະທິບາຍລາຍລະອຽດເພີ່ມເຕີມ...'
            ></textarea>
          </div>

          <h4 className="text-dark fw-bold mb-7 border-bottom pb-3">2. ຂໍ້ມູນການເງິນ (Financial & Units)</h4>

          <div className='row g-9 mb-7'>
            <div className='col-md-4 fv-row'>
              <label className='required fs-6 fw-semibold mb-2'>ຫົວໜ່ວຍ (Base Unit)</label>
              <select
                name='unit'
                className='form-select form-select-solid'
                value={formData.unit}
                onChange={handleChange}
              >
                <option value='Item'>ເຄື່ອງ (Item)</option>
                <option value='Hour'>ຊົ່ວໂມງ (Hour)</option>
                <option value='Day'>ວັນ (Day)</option>
                <option value='Month'>ເດືອນ (Month)</option>
                <option value='Year'>ປີ (Year)</option>
              </select>
            </div>
            <div className='col-md-4 fv-row'>
              <label className='required fs-6 fw-semibold mb-2'>ສະກຸນເງິນ (Currency)</label>
              <select
                name='currency'
                className='form-select form-select-solid'
                value={formData.currency}
                onChange={handleChange}
              >
                <option value='LAK'>ກີບ (LAK)</option>
                <option value='USD'>ໂດລາ (USD)</option>
                <option value='THB'>ບາດ (THB)</option>
              </select>
            </div>
            <div className='col-md-4 fv-row'>
              <label className='required fs-6 fw-semibold mb-2'>ສະຖານະ (Status)</label>
              <select
                name='status'
                className='form-select form-select-solid'
                value={formData.status}
                onChange={handleChange}
              >
                <option value='Active'>ເປີດໃຊ້ງານ (Active)</option>
                <option value='Inactive'>ປິດໃຊ້ງານ (Inactive)</option>
              </select>
            </div>
          </div>

          <div className='row g-9 mb-7'>
            <div className='col-md-4 fv-row'>
              <label className='fs-6 fw-semibold mb-2'>ຕົ້ນທຶນ (Cost Price)</label>
              <input
                type='number'
                name='costPrice'
                className='form-control form-control-solid'
                value={formData.costPrice}
                onChange={handleChange}
                min={0}
              />
            </div>
            <div className='col-md-4 fv-row'>
              <label className='required fs-6 fw-semibold mb-2 text-success'>ລາຄາຂາຍ (Selling Price)</label>
              <input
                type='number'
                name='price'
                className='form-control form-control-solid border-success'
                value={formData.price}
                onChange={handleChange}
                min={0}
              />
            </div>
            <div className='col-md-4 fv-row'>
              <label className='required fs-6 fw-semibold mb-2'>ອັດຕາພາສີ (%)</label>
              <input
                type='number'
                name='taxRate'
                className='form-control form-control-solid'
                value={formData.taxRate}
                onChange={handleChange}
                min={0}
                max={100}
              />
            </div>
          </div>

        </div>
      </div>

      <div className='modal-footer flex-center bg-light border-0'>
        <button type='button' onClick={handleClose} className='btn btn-light me-3' disabled={loading}>
          ຍົກເລີກ
        </button>
        <button type='button' onClick={handleSubmit} className='btn btn-primary' disabled={loading}>
          {!loading ? (
            <span className='indicator-label'>
              <KTIcon iconName='save-2' className='fs-3 me-2' /> 
              {editData ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກລາຍການໃໝ່'}
            </span>
          ) : (
            <span className='indicator-progress' style={{ display: 'block' }}>
              ກຳລັງປະມວນຜົນ... <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          )}
        </button>
      </div>
    </Modal>
  )
}

export default AddItemModal