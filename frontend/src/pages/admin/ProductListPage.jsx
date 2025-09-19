import React, { useState, useEffect } from 'react'; // Add useEffect to import
import { Table, Button, Row, Col } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { useGetProductsQuery, useDeleteProductMutation } from '../../slices/productsApiSlice';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import Message from '../../components/Message';
import Meta from '../../components/Meta';
import { addCurrency } from '../../utils/addCurrency';

const ProductListPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;
  const skip = (currentPage - 1) * limit;
  const [total, setTotal] = useState(0);
  const [totalPage, setTotalPage] = useState(0);

  const { data, isLoading, error } = useGetProductsQuery({ limit, skip });

  const [deleteProduct, { isLoading: isDeleteProductLoading }] = useDeleteProductMutation();

  useEffect(() => {
    if (data) {
      setTotal(data.total);
      setTotalPage(Math.ceil(data.total / limit));
    }
  }, [data, limit]);

  const deleteHandler = async (productId) => {
    try {
      const { data } = await deleteProduct(productId);
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.data?.message || error.error);
    }
  };

  const pageHandler = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPage && pageNum !== currentPage) {
      setCurrentPage(pageNum);
    }
  };

  // Debug: Log products data
  console.log('Products data:', data?.products);

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <Meta title={'Product List'} />
          <h1>Products</h1>
        </Col>
        <Col className='text-end'>
          <LinkContainer to={'/admin/product/create'}>
            <Button className='my-3' variant='warning'>Add Product</Button>
          </LinkContainer>
        </Col>
      </Row>
      {isDeleteProductLoading && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <Table striped hover bordered responsive size='sm'>
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>PRICE</th>
              <th>CATEGORY</th>
              <th>BRAND</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.products?.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{addCurrency(product.price)}</td>
                <td>{product.category}</td>
                <td>{product.brand}</td>
                <td>
                  <LinkContainer to={`/admin/product/update/${product.id}`}>
                    <Button className='btn-sm' variant='light'>
                      <FaEdit />
                    </Button>
                  </LinkContainer>
                  <Button
                    className='btn-sm'
                    variant='light'
                    onClick={() => deleteHandler(product.id)}
                  >
                    <FaTrash style={{ color: 'red' }} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {totalPage > 1 && (
        <Paginate
          currentPage={currentPage}
          totalPage={totalPage}
          pageHandler={pageHandler}
        />
      )}
    </>
  );
};

export default ProductListPage;