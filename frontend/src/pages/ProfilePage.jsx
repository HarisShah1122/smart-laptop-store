import React from 'react';
import { Row, Col, Button, Table } from 'react-bootstrap';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import { LinkContainer } from 'react-router-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import ProfileForm from '../components/ProfileForm';
import { addCurrency } from '../utils/addCurrency';

const ProfilePage = () => {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();

  console.log('Orders:', orders); 

  return (
    <>
      <Row>
        <Col md={3}>
          <Meta title="User Profile" />
          <h2>My Profile</h2>
          <ProfileForm />
        </Col>
        <Col md={9}>
          <h2>My Orders</h2>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <Message variant="danger">
              {error?.data?.message || error.error}
            </Message>
          ) : !orders || orders.length === 0 ? (
            <Message variant="info">No orders found</Message>
          ) : (
            <Table striped hover responsive size="sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DATE</th>
                  <th>TOTAL</th>
                  <th>PAID</th>
                  <th>DELIVERED</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id || 'N/A'}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{addCurrency(order.totalPrice)}</td>
                    <td>
                      {order.isPaid ? (
                        <FaCheck style={{ color: 'green' }} />
                      ) : (
                        <FaXmark style={{ color: 'red' }} />
                      )}
                    </td>
                    <td>
                      {order.isDelivered ? (
                        <FaCheck style={{ color: 'green' }} />
                      ) : (
                        <FaXmark style={{ color: 'red' }} />
                      )}
                    </td>
                    <td>
                      {order._id ? (
                        <LinkContainer to={`/order/${order._id}`}>
                          <Button className="btn-sm" variant="info">
                            Details
                          </Button>
                        </LinkContainer>
                      ) : (
                        <Button className="btn-sm" variant="info" disabled>
                          Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
    </>
  );
};

export default ProfilePage;