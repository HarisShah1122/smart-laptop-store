import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePayOrderMutation } from '../slices/ordersApiSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Message from '../components/Message';
import axios from 'axios';
import { BASE_URL } from '../constants';
import { useSelector } from 'react-redux';

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [payOrder, { isLoading }] = usePayOrderMutation();
  const { userInfo } = useSelector(state => state.auth);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const orderId = query.get('orderId');
    const paymentId = query.get('token');
    const payerId = query.get('PayerID');

    const validatePayPalPayment = async () => {
      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/payment/validate`,
          {
            provider: 'paypal',
            paymentId,
          },
          {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          }
        );

        await payOrder({ orderId, details: data });
        toast.success(data.message);
        navigate(`/order/${orderId}`);
      } catch (error) {
        toast.error(error?.data?.message || error.message || 'PayPal payment validation failed');
        navigate(`/order/${orderId}`);
      }
    };

    if (paymentId && orderId && payerId) {
      validatePayPalPayment();
    } else {
      toast.error('Invalid PayPal payment details');
      navigate('/');
    }
  }, [location, payOrder, navigate, userInfo]);

  return (
    <div>
      {isLoading ? (
        <Loader />
      ) : (
        <Message variant='info'>Processing PayPal payment...</Message>
      )}
    </div>
  );
};

export default SuccessPage;