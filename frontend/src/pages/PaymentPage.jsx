import React, { useState, useEffect } from 'react';
import { Form, Button, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { savePaymentMethod } from '../slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import CheckoutSteps from '../components/CheckoutSteps';
import Meta from '../components/Meta';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('Stripe');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { shippingAddress } = useSelector((state) => state.cart);

  useEffect(() => {
    if (!shippingAddress) {
      navigate('/shipping');
    }
  }, [shippingAddress, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    navigate('/place-order');
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <Meta title="Payment Method" />
      <h1>Payment Method</h1>

      <Form onSubmit={submitHandler}>
        <Form.Group>
          <Form.Label as="legend">Select Method</Form.Label>
          <Col>
            <Form.Check
              className="my-2"
              type="radio"
              id="Stripe"
              label="Stripe"
              name="paymentMethod"
              value="Stripe"
              checked={paymentMethod === 'Stripe'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check>

            <Form.Check
              className="my-2"
              type="radio"
              id="PayPal"
              label="PayPal"
              name="paymentMethod"
              value="PayPal"
              checked={paymentMethod === 'PayPal'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check>
          </Col>
        </Form.Group>

        <Button className="mb-3 w-100" variant="warning" type="submit">
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
};

export default Payment;
