import React from 'react';
import { AdCampaign, GeneratedContent } from '../types';

interface CampaignReviewProps {
  campaign: AdCampaign;
  content: GeneratedContent;
  imagePreview: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLaunching: boolean;
}

export const CampaignReview: React.FC<CampaignReviewProps> = ({ campaign, content, imagePreview, onConfirm, onCancel, isLaunching }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 max-w-2xl w-full shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Campaign Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Creative Preview */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Creative Asset</h3>
          <div className="relative rounded-lg overflow-hidden aspect-square border border-gray-600">
            <img src={imagePreview} alt="Ad Creative" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-white truncate">
              {content.facebookCaption}
            </div>
          </div>
        </div>

        {/* Targeting & Budget */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Objective</h3>
            <p className="text-white font-medium">{campaign.objective}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Target Audience</h3>
            <p className="text-white font-medium">{campaign.audience}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Location</h3>
            <p className="text-white font-medium">{campaign.location}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Budget</h3>
              <p className="text-green-400 font-bold">${campaign.budget}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Duration</h3>
              <p className="text-white font-medium">{campaign.duration} days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button 
          onClick={onCancel}
          disabled={isLaunching}
          className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
        >
          Back
        </button>
        <button 
          onClick={onConfirm}
          disabled={isLaunching}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all"
        >
          {isLaunching ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Launching...
            </>
          ) : (
            'Launch Campaign'
          )}
        </button>
      </div>
    </div>
  );
};