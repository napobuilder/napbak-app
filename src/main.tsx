import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Studio from './Studio';
import Dashboard from './pages/Dashboard';
import { Auth } from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import FounderPage from './pages/FounderPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/login',
    element: <Auth />,
  },
  {
    path: '/studio',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <Studio />,
      },
    ],
  },
  {
    path: '/founder',
    element: <FounderPage />,
  },
  {
    path: '/payment-status',
    element: <PaymentStatusPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
