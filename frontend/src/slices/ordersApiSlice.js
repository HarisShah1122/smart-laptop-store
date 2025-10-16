import { ORDERS_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const ordersApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createOrder: builder.mutation({
      query: order => ({
        url: ORDERS_URL,
        method: 'POST',
        body: { ...order }
      }),
      transformResponse: response => ({
        ...response,
        _id: response._id || response.id
      }),
      invalidatesTags: ['Order']
    }),

    getOrderDetails: builder.query({
      query: orderId => {
        console.log('API Slice orderId:', orderId, 'Type:', typeof orderId, 'URL:', `${ORDERS_URL}/${orderId}`); // Debug log
        return { url: `${ORDERS_URL}/${orderId}` };
      },
      transformResponse: response => ({
        ...response,
        _id: response._id || response.id
      }),
      providesTags: ['Order']
    }),

    getMyOrders: builder.query({
      query: () => ({
        url: `${ORDERS_URL}/my-orders`
      }),
      transformResponse: response =>
        response.map(order => ({
          ...order,
          _id: order._id || order.id
        })),
      providesTags: ['Order']
    }),

    payOrder: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `${ORDERS_URL}/${orderId}/pay`,
        method: 'PUT',
        body: { ...details }
      }),
      invalidatesTags: ['Order']
    }),

    updateDeliver: builder.mutation({
      query: orderId => ({
        url: `${ORDERS_URL}/${orderId}/deliver`,
        method: 'PUT'
      }),
      invalidatesTags: ['Order']
    }),

    getPaymentConfig: builder.query({
      query: () => ({
        url: '/api/v1/payment/config'
      }),
      providesTags: ['Order']
    }),

    getOrders: builder.query({
      query: () => ({
        url: ORDERS_URL
      }),
      transformResponse: response =>
        response.map(order => ({
          ...order,
          _id: order._id || order.id
        })),
      providesTags: ['Order']
    })
  })
});

export const {
  useGetOrderDetailsQuery,
  useCreateOrderMutation,
  usePayOrderMutation,
  useUpdateDeliverMutation,
  useGetPaymentConfigQuery,
  useGetMyOrdersQuery,
  useGetOrdersQuery
} = ordersApiSlice;