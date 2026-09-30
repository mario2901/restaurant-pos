import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import OrderContextProvider from "./context/OrderContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OrderContextProvider>
        <App />
      </OrderContextProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
);
