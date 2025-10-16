import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "axios";

const CheckoutForm = ({ order }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // 1️⃣ Create a payment intent on the backend
      const { data } = await axios.post(
        "http://localhost:5000/api/v1/payment/create-payment-intent",
        { amount: order.totalPrice }
      );

      const { clientSecret } = data;

      // 2️⃣ Confirm the card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        alert(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        alert("✅ Payment Successful!");
        console.log("Payment ID:", result.paymentIntent.id);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          borderRadius: "8px",
          backgroundColor: "#6772e5",
          color: "white",
          border: "none",
        }}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

export default CheckoutForm;
