import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/styles/index.css";
import Routes from "./routes/Routes";
import store from "./store";
import reportWebVitals from "./reportWebVitals";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <Elements stripe={stripePromise}>
          <Routes />
        </Elements>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);

reportWebVitals();
