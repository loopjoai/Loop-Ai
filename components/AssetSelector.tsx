import React from 'react';
import { MetaAsset } from '../types';

interface AssetSelectorProps {
  assets: MetaAsset[];
  onConfirm: (selection: { page: string; instagram: string; adAccount: string }) => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({ assets, onConfirm }) => {
  const [selectedPage, setSelectedPage] = React.useState('');
  const [selectedIg, setSelectedIg] = React.useState('');
  const [selectedAd, setSelectedAd] = React.useState('');

  const pages = assets.filter(a => a.type === 'page');
  const igs = assets.filter(a => a.type === 'instagram');
  const ads = assets.filter(a => a.type === 'ad_account');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPage && selectedIg && selectedAd) {
      onConfirm({ page: selectedPage, instagram: selectedIg, adAccount: selectedAd });
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-white">Select Your Accounts</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Facebook Page</label>
          <select 
            value={selectedPage} 
            onChange={e => setSelectedPage(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select a Page</option>
            {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Instagram Business</label>
          <select 
            value={selectedIg} 
            onChange={e => setSelectedIg(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select an Account</option>
            {igs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Ad Account</label>
          <select 
            value={selectedAd} 
            onChange={e => setSelectedAd(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select Ad Account</option>
            {ads.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={!selectedPage || !selectedIg || !selectedAd}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors mt-4"
        >
          Continue
        </button>
      </form>
    </div>
  );
};