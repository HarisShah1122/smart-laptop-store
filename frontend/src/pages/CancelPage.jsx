import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Message from '../components/Message';

const CancelPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error('PayPal payment was cancelled');
    navigate('/'); // Redirect to home or order page
  }, [navigate]);

  return <Message variant="warning">Payment Cancelled</Message>;
};

export default CancelPage;