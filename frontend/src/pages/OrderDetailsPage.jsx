import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, ListGroup, Button, Image, Card } from 'react-bootstrap';
import {
  useGetOrderDetailsQuery,
  usePayOrderMutation,
  useUpdateDeliverMutation,
  useGetRazorpayApiKeyQuery
} from '../slices/ordersApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaIndianRupeeSign } from 'react-icons/fa6';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import axios from 'axios';
import { addCurrency } from '../utils/addCurrency';
import { BASE_URL } from '../constants';

const OrderDetailsPage = () => {
  const { id: orderId } = useParams();
  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);
  const [payOrder, { isLoading: isPayOrderLoading }] = usePayOrderMutation();
  const [updateDeliver, { isLoading: isUpdateDeliverLoading }] = useUpdateDeliverMutation();
  const { userInfo } = useSelector(state => state.auth);
  const { data: razorpayApiKey } = useGetRazorpayApiKeyQuery();
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // default Razorpay

  // === Razorpay Payment ===
  const handleRazorpayPayment = async () => {
    try {
      const razorpayData = {
        amount: order.totalPrice * 100,
        currency: 'INR',
        receipt: `receipt#${orderId}`,
      };
      const { data } = await axios.post(`${BASE_URL}/api/v1/payment/razorpay/order`, razorpayData);
      const { id: razorpayOrderId } = data;

      const options = {
        key: razorpayApiKey.razorpayKeyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'ERX Solutions',
        description: 'Test Transaction',
        order_id: razorpayOrderId,
        handler: async response => {
          const { data } = await axios.post(`${BASE_URL}/api/v1/payment/razorpay/order/validate`, response);
          const details = { ...data, email: order?.user?.email };
          await payOrder({ orderId, details });
          toast.success(data.message);
        },
        prefill: {
          name: order?.user?.name,
          email: order?.user?.email,
        },
        theme: {
          color: '#FFC107',
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      toast.error(error?.data?.message || error.error);
    }
  };

  // === Stripe Payment ===
  const handleStripePayment = async () => {
    try {
      const { data } = await axios.post(`${BASE_URL}/api/v1/payment/stripe/create-payment-intent`, {
        amount: order.totalPrice * 100,
        currency: 'usd',
      });

      const stripe = window.Stripe(data.publishableKey);
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
      toast.error(error?.data?.message || error.error);
    }
  };

  // === PayPal Payment ===
  const handlePayPalPayment = async () => {
    try {
      const { data } = await axios.post(`${BASE_URL}/api/v1/payment/paypal/create-order`, {
        amount: order.totalPrice,
        currency: 'USD',
      });

      window.location.href = data.approvalUrl; // redirect to PayPal checkout
    } catch (error) {
      toast.error(error?.data?.message || error.error);
    }
  };

  const deliveredHandler = async () => {
    try {
      await updateDeliver(orderId);
      toast.success('Order Delivered');
    } catch (error) {
      toast.error(error?.data?.message || error.error);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'razorpay') handleRazorpayPayment();
    else if (paymentMethod === 'stripe') handleStripePayment();
    else if (paymentMethod === 'paypal') handlePayPalPayment();
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : (
        <>
          <Meta title={'Order Details'} />
          <h1>Order ID: {orderId}</h1>
          <Row>
            <Col md={8}>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h2>Shipping</h2>
                  <p><strong>Name:</strong> {order?.user?.name}</p>
                  <p><strong>Email:</strong> {order?.user?.email}</p>
                  <p><strong>Address:</strong> {order?.shippingAddress?.address}, {order?.shippingAddress?.city}, {order?.shippingAddress?.postalCode}, {order?.shippingAddress?.country}</p>
                  {order?.isDelivered ? (
                    <Message variant='success'>
                      Delivered on {new Date(order?.deliveredAt).toLocaleString()}
                    </Message>
                  ) : (
                    <Message variant='danger'>Not Delivered</Message>
                  )}
                </ListGroup.Item>

                <ListGroup.Item>
                  <h2>Payment Method</h2>
                  <p><strong>Method:</strong> {order?.paymentMethod}</p>
                  {order?.isPaid ? (
                    <Message variant='success'>
                      Paid on {new Date(order?.paidAt).toLocaleString()}
                    </Message>
                  ) : (
                    <Message variant='danger'>Not Paid</Message>
                  )}
                </ListGroup.Item>

                <ListGroup.Item>
                  <h2>Order Items</h2>
                  <ListGroup variant='flush'>
                    {order?.orderItems?.map(item => (
                      <ListGroup.Item key={item._id}>
                        <Row>
                          <Col md={2}>
                            <Image src={item.image} alt={item.name} fluid rounded />
                          </Col>
                          <Col md={6}>
                            <Link to={`/product/${item._id}`} className='text-dark' style={{ textDecoration: 'none' }}>
                              {item.name}
                            </Link>
                          </Col>
                          <Col md={4}>
                            {item.qty} x {addCurrency(item.price)} = {addCurrency(item.qty * item.price)}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </ListGroup.Item>
              </ListGroup>
            </Col>

            <Col md={4}>
              <Card>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <h2>Order Summary</h2>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row><Col>Items:</Col><Col>{addCurrency(order?.itemsPrice)}</Col></Row>
                    <Row><Col>Shipping:</Col><Col>{addCurrency(order?.shippingPrice)}</Col></Row>
                    <Row><Col>Tax:</Col><Col>{addCurrency(order?.taxPrice)}</Col></Row>
                    <Row><Col>Total:</Col><Col>{addCurrency(order?.totalPrice)}</Col></Row>
                  </ListGroup.Item>

                  {!order?.isPaid && !userInfo.isAdmin && (
                    <>
                      <ListGroup.Item>
                        <h5>Select Payment Method:</h5>
                        <select
                          className='form-select mb-3'
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value='razorpay'>Razorpay</option>
                          <option value='stripe'>Stripe</option>
                          <option value='paypal'>PayPal</option>
                        </select>
                        <Button
                          className='w-100'
                          variant='warning'
                          onClick={handlePayment}
                          disabled={isPayOrderLoading}
                        >
                          Pay with {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                        </Button>
                      </ListGroup.Item>
                    </>
                  )}

                  {userInfo?.isAdmin && order?.isPaid && !order?.isDelivered && (
                    <ListGroup.Item>
                      <Button
                        onClick={deliveredHandler}
                        variant='warning'
                        disabled={isUpdateDeliverLoading}
                      >
                        Mark As Delivered
                      </Button>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default OrderDetailsPage;
