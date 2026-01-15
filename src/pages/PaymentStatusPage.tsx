import React, { useEffect, useState } from 'react';

const PaymentStatusPage: React.FC = () => {
  const [status, setStatus] = useState<'success' | 'cancelled' | 'pending'>('pending');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('status');

    if (paymentStatus === 'success') {
      setStatus('success');
      setMessage('Thank you! Your payment was successful. Your account has been upgraded.');
      // Here you might trigger a data re-fetch for the user profile
    } else if (paymentStatus === 'cancelled') {
      setStatus('cancelled');
      setMessage('Your payment was cancelled. You can try again anytime.');
    } else {
      setStatus('pending');
      setMessage('No payment status detected. Returning to the main app...');
    }
  }, []);

  const handleReturn = () => {
    // Simple redirect, can be replaced with router logic later
    window.location.href = '/'; 
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-lg">
        {status === 'success' && <h1 className="text-4xl font-bold text-green-400 mb-4">Payment Successful!</h1>}
        {status === 'cancelled' && <h1 className="text-4xl font-bold text-red-400 mb-4">Payment Cancelled</h1>}
        
        <p className="text-lg text-gray-300 mb-8">{message}</p>

        <button onClick={handleReturn} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Return to App
        </button>
      </div>
    </div>
  );
};

export default PaymentStatusPage;
