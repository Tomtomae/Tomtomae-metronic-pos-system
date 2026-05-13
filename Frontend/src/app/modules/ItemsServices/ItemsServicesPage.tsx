import React, { useEffect, useState } from 'react'
import AddItemModal from './componeItemServices/AddItemModal'
import { KTIcon } from '../../../_metronic/helpers'
import { ItemModel, statusTranslations } from './componeItemServices/ItemModel'
import axios, { AxiosError } from 'axios'
import Swal from 'sweetalert2' // 🌟 1. Import Swal

const API_URL = import.meta.env.VITE_APP_API_URL;
export const Get_User_ItemServices = `${API_URL}/itemServices`

const ItemsServicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('all')
  const [items, setItems] = useState<ItemModel[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await axios.get(Get_User_ItemServices)
      setItems(response.data)
    } catch (error: unknown) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleAddNew = () => {
    setSelectedItem(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item: ItemModel) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleSaveData = async () => {
    fetchItems() 
    setIsModalOpen(false)
  }

  const handleDeleteData = async (item: ItemModel) => {
    // 🌟 2. ປ່ຽນ window.confirm ເປັນ SweetAlert2
    const result = await Swal.fire({
      title: 'ຢືນຢັນການລຶບ?',
      text: `ທ່ານຕ້ອງການລຶບລາຍການ [${item.ItemCode}] ແທ້ຫຼືບໍ່?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f1416c',
      cancelButtonColor: '#B5B5C3',
      confirmButtonText: 'ແມ່ນແລ້ວ, ລຶບເລີຍ!',
      cancelButtonText: 'ຍົກເລີກ'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true)
        await axios.delete(`${Get_User_ItemServices}/${item.ItemCode}`)
        fetchItems() 
        
        // 🌟 ແຈ້ງເຕືອນລຶບສຳເລັດ
        Swal.fire({
          title: 'ລຶບສຳເລັດ!',
          text: 'ຂໍ້ມູນຖືກລຶບອອກຈາກລະບົບແລ້ວ.',
          icon: 'success',
          confirmButtonColor: '#50cd89',
          timer: 2000,
          showConfirmButton: false
        })
      } catch (error: unknown) {
        console.error('Delete Error:', error)
        let errorMessage = 'ເກີດຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນ';
        if (axios.isAxiosError(error)) {
          const serverError = error as AxiosError<{ message: string }>;
          errorMessage = serverError.response?.data?.message || errorMessage;
        }
        
        // 🌟 ແຈ້ງເຕືອນລຶບບໍ່ສຳເລັດ
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
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.Iname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.ItemCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="d-flex flex-column ps-0 py-10">
      <div className='card card-flush'>
        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <KTIcon iconName='magnifier' className='fs-1 position-absolute ms-4' />
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='ຄົ້ນຫາລາຍການ (ຊື່, ລະຫັດ)...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className='ms-3'>
              <select
                className='form-select form-select-solid fw-bold w-150px'
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value='all'>ທັງໝົດ</option>
                <option value='Product'>ສິນຄ້າ</option>
                <option value='Service'>ບໍລິການ</option>
              </select>
            </div>
          </div>

          <div className='card-toolbar'>
            <button className='btn btn-primary fw-bold' onClick={handleAddNew}>
              <KTIcon iconName='plus' className='fs-2' /> ເພີ່ມລາຍການໃໝ່
            </button>

            <AddItemModal
              show={isModalOpen}
              handleClose={() => setIsModalOpen(false)}
              onSave={handleSaveData}
              editData={selectedItem}
            />
          </div>
        </div>

        <div className='card-body pt-0'>
          <div className='table-responsive'>
            <table className='table align-middle table-row-dashed fs-6 gy-5'>
              <thead>
                <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                  <th>ລະຫັດ</th>
                  <th className='min-w-150px'>ຊື່ລາຍການ</th>
                  <th className='text-center'>ປະເພດ</th>
                  <th className='text-center'>ສະຖານະ</th>
                  <th className='text-end'>ລາຄາ</th>
                  <th className='text-center'>ພາສີ (%)</th>
                  <th className='text-end min-w-100px'>ການດຳເນີນ</th>
                </tr>
              </thead>
              <tbody className='fw-semibold text-gray-600'>
                {loading ? (
                  <tr><td colSpan={7} className='text-center py-10'><span className="spinner-border spinner-border-sm me-2 align-middle"></span> ກຳລັງໂຫລດ...</td></tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item._id} className={item.status === 'Inactive' ? 'bg-light-danger opacity-75' : ''}>
                      <td className='text-dark fw-bold'>{item.ItemCode}</td>
                      <td>
                        <span className='text-gray-800 fw-bold d-block'>{item.Iname}</span>
                        {item.category && <span className="text-muted fs-7">{item.category}</span>}
                      </td>
                      <td className='text-center'>
                        <span className={`badge ${item.type === 'Product' ? 'badge-light-primary' : 'badge-light-warning'}`}>
                          {item.type === 'Product' ? 'ສິນຄ້າ' : 'ບໍລິການ'}
                        </span>
                      </td>
                      <td className='text-center'>
                        <span className={`badge ${item.status === 'Inactive' ? 'badge-light-danger' : 'badge-light-success'}`}>
                          {statusTranslations[item.status || 'Active'] || item.status}
                        </span>
                      </td>
                      <td className='text-end text-dark fw-bold'>
                        {item.price?.toLocaleString()} <span className="fs-8 text-muted">{item.currency || 'LAK'}</span>
                      </td>
                      <td className='text-center'>{item.taxRate}%</td>
                      <td className='text-end'>
                        <button 
                          className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-2'
                          onClick={() => handleEdit(item)}
                          title='ແກ້ໄຂ'
                        >
                          <KTIcon iconName='pencil' className='fs-3' />
                        </button>

                        <button 
                          className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                          onClick={() => handleDeleteData(item)}
                          title='ລຶບ'
                          disabled={item.status === 'Inactive'} 
                        >
                          <KTIcon iconName='trash' className='fs-3' />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className='text-center py-10 text-muted'>ບໍ່ມີຂໍ້ມູນທີ່ທ່ານຄົ້ນຫາ "{searchTerm}"</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemsServicesPage