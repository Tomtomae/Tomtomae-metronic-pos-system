import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KTIcon } from '../../../_metronic/helpers';

import CustomerProfile from './ComponetCustomer/CustomerProfile';
import { customer } from './ComponetCustomer/CustomerModuls';
import { CreateCustomerModal } from './ComponetCustomer/CreateCustomer'; 

const CustomerListPage: React.FC = () => {
  const [customers, setCustomers] = useState<customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // 🌟 State ສຳລັບເກັບຄຳຄົ້ນຫາ (Search)
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/Customer`);
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((user) => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contact?.phone?.includes(searchTerm) ||
    user.taxId?.includes(searchTerm)
  );

  if (selectedCustomer) {
    return (
      <CustomerProfile 
        customer={selectedCustomer} 
        onBack={() => setSelectedCustomer(null)} 
        onUpdateSuccess={() => fetchCustomers()} 
      />
    );
  }

  return (
    <div className="d-flex flex-column ps-0 py-10">


      <div className='card card-flush'>
        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <KTIcon iconName='magnifier' className='fs-1 position-absolute ms-4' />
              {/* 🌟 ຜູກ Input ກັບ state searchTerm */}
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='ຄົ້ນຫາລູກຄ້າ, ອີເມວ, ເບີໂທ...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className='card-toolbar'>
            <button 
              className='btn btn-primary fw-bold'
              onClick={() => setShowCreateModal(true)}
            >
              <KTIcon iconName='plus' className='fs-2' /> ເພີ່ມລູກຄ້າໃໝ່
            </button>
          </div>
        </div>

        <div className='card-body pt-0'>
          <div className='table-responsive'>
            {loading ? (
              <div className='text-center py-10'>
                <span className="spinner-border spinner-border-sm align-middle me-2"></span> ກຳລັງໂຫລດ...
              </div>
            ) : (
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th className='min-w-150px'>ຊື່ບໍລິສັດ / ລູກຄ້າ</th>
                    <th className='min-w-125px'>ຂໍ້ມູນຕິດຕໍ່</th>
                    <th className='min-w-100px'>Tax ID</th>
                    <th className='min-w-100px'>Payment Terms</th>
                    <th className='text-end min-w-100px'>ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {/* 🌟 ໃຊ້ filteredCustomers ແທນ customers */}
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer._id || index}>
                      <td>
                        <div className='d-flex flex-column'>
                          <button
                            className='btn btn-link p-0 text-start text-gray-800 text-hover-primary fw-bold'
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            {customer.name}
                          </button>
                          <span className='fs-7 text-muted'>ID: {customer.paymentNo || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className='d-flex flex-column'>
                          <span>{customer.email}</span>
                          <span className='fs-7 text-muted'>{customer.contact?.phone || '-'}</span>
                        </div>
                      </td>
                      <td>{customer.taxId || '-'}</td>
                      <td>
                        <span className='badge badge-light-info text-uppercase'>
                          {customer.paymentTerms || 'Net 30'}
                        </span>
                      </td>
                      <td className='text-end'>
                        <button
                          className='btn btn-sm btn-light btn-active-light-primary'
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          ຈັດການ <KTIcon iconName='right' className='ms-1' />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* 🌟 ກໍລະນີຄົ້ນຫາບໍ່ເຫັນ */}
                  {filteredCustomers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className='text-center py-10 text-muted'>
                        ບໍ່ພົບຂໍ້ມູນລູກຄ້າທີ່ຄົ້ນຫາ "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <CreateCustomerModal 
        show={showCreateModal} 
        handleClose={() => setShowCreateModal(false)} 
        onSuccess={() => {
          fetchCustomers(); 
          setShowCreateModal(false);
        }} 
      />
    </div>
  );
};

export default CustomerListPage;