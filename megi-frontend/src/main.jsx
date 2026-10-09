import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import OrderContextProvider from "./context/OrderContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router/dom";
import { router } from "./router.jsx";
const queryClient = new QueryClient({});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OrderContextProvider>
        <RouterProvider router={router} />
      </OrderContextProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
);
