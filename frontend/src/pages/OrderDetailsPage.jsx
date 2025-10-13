import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Button, Image, Card } from 'react-bootstrap';
import {
  useGetOrderDetailsQuery,
  usePayOrderMutation,
  useUpdateDeliverMutation,
  useGetPaymentConfigQuery
} from '../slices/ordersApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import axios from 'axios';
import { addCurrency } from '../utils/addCurrency';
import { BASE_URL } from '../constants';

const OrderDetailsPage = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  console.log('Order ID from useParams:', orderId); // Debug log
  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId, { skip: !orderId });
  const [payOrder, { isLoading: isPayOrderLoading }] = usePayOrderMutation();
  const [updateDeliver, { isLoading: isUpdateDeliverLoading }] = useUpdateDeliverMutation();
  const { userInfo } = useSelector(state => state.auth);
  const { data: paymentConfig } = useGetPaymentConfigQuery();
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  useEffect(() => {
    if (!orderId) {
      toast.error('Invalid order ID');
      navigate('/profile');
      return;
    }

    const stripeScript = document.createElement('script');
    stripeScript.src = 'https://js.stripe.com/v3/';
    stripeScript.async = true;
    document.body.appendChild(stripeScript);
    return () => {
      document.body.removeChild(stripeScript);
    };
  }, [orderId, navigate]);

  const convertToUSD = (pkrAmount) => Math.round(pkrAmount / 280 * 100);

  const handleStripePayment = async () => {
    try {
      if (!paymentConfig?.stripePublishableKey) {
        throw new Error('Stripe configuration not loaded');
      }

      const { data } = await axios.post(
        `${BASE_URL}/api/v1/payment/order`,
        {
          amount: convertToUSD(order.totalPrice),
          currency: 'usd',
          provider: 'stripe',
          orderId,
        },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        }
      );

      const stripe = window.Stripe(paymentConfig.stripePublishableKey);
      if (!stripe) {
        throw new Error('Stripe.js failed to load');
      }

      await stripe.redirectToCheckout({
        sessionId: data.id,
      });
    } catch (error) {
      toast.error(error?.data?.message || error.message || 'Stripe payment failed');
    }
  };

  const handlePayPalPayment = async () => {
    try {
      if (!paymentConfig?.paypalClientId) {
        throw new Error('PayPal configuration not loaded');
      }

      const { data } = await axios.post(
        `${BASE_URL}/api/v1/payment/order`,
        {
          amount: convertToUSD(order.totalPrice),
          currency: 'usd',
          provider: 'paypal',
          orderId,
        },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        }
      );

      window.location.href = data.approvalUrl;
    } catch (error) {
      toast.error(error?.data?.message || error.message || 'PayPal payment failed');
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
    if (paymentMethod === 'stripe') handleStripePayment();
    else if (paymentMethod === 'paypal') handlePayPalPayment();
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : !order ? (
        <Message variant='danger'>Order not found</Message>
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

                  {!order?.isPaid && !userInfo?.isAdmin && (
                    <ListGroup.Item>
                      <h5>Select Payment Method:</h5>
                      <select
                        className='form-select mb-3'
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value='stripe'>Stripe</option>
                        <option value='paypal'>PayPal</option>
                      </select>
                      <Button
                        className='w-100'
                        variant='warning'
                        onClick={handlePayment}
                        disabled={isPayOrderLoading || !paymentConfig}
                      >
                        Pay with {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                      </Button>
                    </ListGroup.Item>
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