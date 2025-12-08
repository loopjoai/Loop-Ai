import React from 'react';
import { BusinessPortfolio } from '../types';

interface PortfolioSelectorProps {
  portfolios: BusinessPortfolio[];
  onSelect: (portfolio: BusinessPortfolio) => void;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({ portfolios, onSelect }) => {
  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Select Business Portfolio</h2>
        <p className="text-gray-400 mt-2">Choose the Meta Business Manager portfolio you want to work with.</p>
      </div>

      <div className="space-y-3">
        {portfolios.map((portfolio) => (
          <button
            key={portfolio.id}
            onClick={() => onSelect(portfolio)}
            className="w-full group flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-700 hover:border-blue-500 hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-lg group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                {portfolio.name.charAt(0)}
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">{portfolio.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  portfolio.verificationStatus === 'verified' 
                    ? 'border-green-500/30 text-green-400 bg-green-500/10' 
                    : 'border-gray-600 text-gray-500'
                }`}>
                  {portfolio.verificationStatus === 'verified' ? 'Verified Business' : 'Unverified'}
                </span>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};