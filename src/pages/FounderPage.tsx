import React from 'react';

const FounderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl mx-auto bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl p-8 md:p-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/napbak app.png" alt="napbak Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">Become a Founding Member</h1>
          <p className="text-lg text-gray-400 mt-2">
            Join the inner circle and help shape the future of music creation.
          </p>
        </div>
        
        {/* Pricing and Benefits Section */}
        <div className="bg-gray-700/50 p-8 rounded-xl border border-gray-600">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            
            {/* Left Side: Benefits */}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Founder's Lifetime Deal</h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Lifetime access to all core features.</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Your name immortalized in the credits.</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Early access to all new features & plugins.</span>
                </li>
                 <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Direct influence on the development roadmap.</span>
                </li>
              </ul>
            </div>

            {/* Right Side: Price & CTA */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400 line-through">Value: $299</p>
              <p className="text-6xl font-bold text-white mb-4">$37</p>
              <p className="text-yellow-400 text-sm mb-4">One-time payment</p>
              {/* PayPal button will be integrated here */}
              <div id="paypal-button-container" className="min-h-[50px]">
                <p className="text-gray-500">PayPal loading...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
            <a href="/studio" className="text-gray-400 hover:text-white transition-colors">
                Maybe later, take me back to the studio
            </a>
        </div>

      </div>
    </div>
  );
};

export default FounderPage;
