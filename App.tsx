import React, { useState, useEffect, useRef } from 'react';
import { AppStep, BrandProfile, AdConcept, CampaignSettings, BusinessPortfolio, MetaAsset, LogoPosition } from './types';
import { 
  initiateFacebookLogin, 
  handleAuthCallback, 
  getAssets, 
  launchCampaign, 
  getPortfolios, 
  setAccessToken,
  getAccessToken
} from './services/mockMetaService';
import { PortfolioSelector } from './components/PortfolioSelector';
import { AssetSelector } from './components/AssetSelector';
import { generateAdConcepts, generateAdVisual, generateLogo, generateProductImage, generateBusinessNames, generateImagePrompts, generateTargetingSuggestions } from './services/geminiService';
import { CreativePreview } from './components/CreativePreview';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Generation States
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isGeneratingProduct, setIsGeneratingProduct] = useState(false);
  const [isAutoTargeting, setIsAutoTargeting] = useState(false);
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  
  // STEP 1: Brand Data
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({
    businessName: '',
    productImage: null,
    logoImage: null,
    description: '',
    niche: '',
    targetAudience: ''
  });

  // Name Generation State
  const [nameMode, setNameMode] = useState<'manual' | 'generate'>('manual');
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);

  const [logoMode, setLogoMode] = useState<'upload' | 'generate'>('upload');
  const [logoGenText, setLogoGenText] = useState(''); // Text specifically for logo generation

  const [productMode, setProductMode] = useState<'upload' | 'generate'>('upload');
  const [productGenDescription, setProductGenDescription] = useState('');
  const [imageSuggestions, setImageSuggestions] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  // STEP 2: Creative Data
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<AdConcept | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null); // Ref for scrolling
  
  // Logo Position State (Defaults to Top-Left roughly)
  const [logoPosition, setLogoPosition] = useState<LogoPosition>({ x: 6, y: 4 });

  // STEP 3 (Now part of Review): Campaign Settings
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings>({
    objective: 'TRAFFIC',
    budgetType: 'DAILY',
    budgetAmount: 20,
    duration: 7, // Days
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    locations: 'United States',
    ageRange: '18-65',
    gender: 'ALL',
    interests: ''
  });
  
  const [autoTargeting, setAutoTargeting] = useState(false); // Toggle state

  // Map state for simulation
  const [mapSearch, setMapSearch] = useState('');
  const [mapPinVisible, setMapPinVisible] = useState(false);

  // STEP 4 & 5: Meta Data
  const [portfolios, setPortfolios] = useState<BusinessPortfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<BusinessPortfolio | null>(null);
  const [assets, setAssets] = useState<MetaAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<{page: string, instagram: string, adAccount: string} | null>(null);
  const [launchResult, setLaunchResult] = useState<string | null>(null);

  // Refs for file inputs
  const productInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync business name to logo text initially
  useEffect(() => {
    if (brandProfile.businessName && !logoGenText) {
      setLogoGenText(brandProfile.businessName);
    }
  }, [brandProfile.businessName]);

  // --- OAUTH LISTENER ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FACEBOOK_AUTH_SUCCESS' && event.data?.token) {
        setAccessToken(event.data.token);
        fetchPortfolios();
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Check if we are the popup
    if (window.opener && window.location.hash.includes('access_token')) {
       handleAuthCallback(); 
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchPortfolios = async () => {
    setStep(AppStep.META_CONNECT);
    try {
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length === 0) {
         await fetchAssets({ id: 'personal', name: 'Personal Account', verificationStatus: 'unverified' });
      }
    } catch (e) {
      console.error(e);
      await fetchAssets({ id: 'personal', name: 'Personal Account', verificationStatus: 'unverified' });
    }
  };

  const fetchAssets = async (portfolio: BusinessPortfolio) => {
    setSelectedPortfolio(portfolio);
    try {
      const data = await getAssets(portfolio.id);
      setAssets(data);
      setStep(AppStep.ASSET_SELECTION);
    } catch (e) {
      console.error(e);
      alert("Failed to load assets.");
    }
  };

  // --- HANDLERS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'productImage' | 'logoImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandProfile(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameGeneration = async () => {
    if (!brandProfile.niche) {
      alert("Please enter a Business Niche first (e.g., Coffee Shop, Marketing Agency).");
      return;
    }
    setIsGeneratingNames(true);
    try {
      const names = await generateBusinessNames(brandProfile.niche);
      setSuggestedNames(names);
    } catch (e) {
      alert("Failed to suggest names. Please try entering one manually.");
    } finally {
      setIsGeneratingNames(false);
    }
  };

  const handleLogoGeneration = async () => {
    if (!logoGenText) {
      alert("Please enter the text to appear on the logo.");
      return;
    }
    // Simple English validation
    if (/[^\x00-\x7F]/.test(logoGenText)) {
      alert("Please use English characters ONLY for the logo text. AI cannot render other languages correctly on images.");
      return;
    }

    if (!brandProfile.niche) {
      alert("Please enter your business niche/type first.");
      return;
    }
    setIsGeneratingLogo(true);
    try {
      const logo = await generateLogo(logoGenText, brandProfile.niche);
      setBrandProfile(prev => ({ ...prev, logoImage: logo }));
    } catch (e) {
      alert("Failed to generate logo. Try again.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleDownloadLogo = () => {
    if (brandProfile.logoImage) {
      const link = document.createElement('a');
      link.href = brandProfile.logoImage;
      link.download = `logo-${logoGenText || 'ai'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePromptSuggestion = async () => {
     if (!brandProfile.niche) {
        alert("Please enter a Business Niche first.");
        return;
     }
     setIsGeneratingPrompts(true);
     try {
        const prompts = await generateImagePrompts(brandProfile.niche);
        setImageSuggestions(prompts);
     } catch(e) {
        alert("Could not generate suggestions.");
     } finally {
        setIsGeneratingPrompts(false);
     }
  };

  const handleProductGeneration = async () => {
    if (!productGenDescription) {
      alert("Please describe the image you want to generate.");
      return;
    }
    if (!brandProfile.niche) {
      alert("Please enter your business niche first.");
      return;
    }
    setIsGeneratingProduct(true);
    try {
      const image = await generateProductImage(productGenDescription, brandProfile.niche);
      setBrandProfile(prev => ({ ...prev, productImage: image }));
    } catch (e) {
      alert("Failed to generate product image. Try again.");
    } finally {
      setIsGeneratingProduct(false);
    }
  };

  const generateCreatives = async () => {
    setIsLoading(true);
    setSelectedConcept(null);
    setGeneratedImage(null);
    
    try {
      const generated = await generateAdConcepts(brandProfile);
      setConcepts(generated);
      setStep(AppStep.CREATIVE_GENERATION);
    } catch (e) {
      alert("Failed to generate concepts. Please ensure you have entered a niche or business type.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedConcept) return;
    setIsGeneratingImage(true);
    try {
      const image = await generateAdVisual(
        brandProfile.productImage,
        brandProfile.logoImage,
        selectedConcept,
        logoPosition
      );
      setGeneratedImage(image);
    } catch (e) {
      console.error(e);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleLaunch = async () => {
    if (!selectedAssets || !selectedConcept) return;
    setStep(AppStep.LAUNCHING);
    try {
      const resultId = await launchCampaign(selectedAssets.adAccount, campaignSettings);
      setLaunchResult(resultId);
      setStep(AppStep.SUCCESS);
    } catch (e: any) {
      alert(`Launch failed: ${e.message}`);
      setStep(AppStep.ASSET_SELECTION);
    }
  };

  const handleDownloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `socialai-creative-${Date.now()}.png`;
      link.target = "_blank"; // Fix for some browsers
      document.body.appendChild(link);
      
      // Attempt click
      try {
        link.click();
      } catch (err) {
        console.warn("Auto download failed, opening new tab", err);
        window.open(generatedImage, '_blank');
      }
      
      document.body.removeChild(link);
    } else {
      alert("Image not generated yet. Please click the 'Magic Image' button first.");
    }
  };

  const handleAutoTargetingToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setAutoTargeting(isEnabled);
    
    if (isEnabled) {
      setIsAutoTargeting(true);
      try {
        // Call AI to generate settings
        const suggested = await generateTargetingSuggestions(brandProfile);
        setCampaignSettings(prev => ({
          ...prev,
          objective: (suggested.objective as any) || 'TRAFFIC',
          locations: suggested.locations || 'United States',
          ageRange: suggested.ageRange || '18-65',
          gender: (suggested.gender as any) || 'ALL',
          interests: suggested.interests || ''
        }));
        if (suggested.locations) {
           setMapSearch(suggested.locations);
           setMapPinVisible(true);
        }
      } catch (err) {
        console.error("Auto target failed", err);
      } finally {
        setIsAutoTargeting(false);
      }
    }
  };
  
  const handleMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapSearch) {
       setMapPinVisible(true);
       setCampaignSettings({...campaignSettings, locations: mapSearch});
    }
  };

  const handleSaveSettings = () => {
    setIsSettingsSaved(true);
    // Smooth scroll to bottom
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // --- RENDERERS ---

  if (step === AppStep.LANDING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up flex flex-col items-center">
          <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tighter mb-4 drop-shadow-lg">
            Loop Ai
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Automate your social media marketing with the power of AI.
          </p>
          <button 
            onClick={() => setStep(AppStep.BRAND_INPUT)}
            className="mt-8 group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-500 hover:scale-105 shadow-xl shadow-blue-600/30"
          >
            Start Automating
            <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-6 text-gray-500 text-sm">
          Powered by Gemini AI & Meta Graph API
        </div>
      </div>
    );
  }

  if (step === AppStep.BRAND_INPUT) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4 pb-24">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Step 1: Brand & Assets</h1>
            <p className="text-gray-400 mt-2">Define your business. Use AI to create a logo or product image if needed.</p>
          </div>

          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl space-y-8">
            {/* 1. BUSINESS TYPE (NICHE) */}
            <div>
               <label className="block text-lg font-bold text-white mb-2">1. What is your Business Type/Niche?</label>
               <input 
                 type="text"
                 value={brandProfile.niche}
                 onChange={(e) => setBrandProfile({...brandProfile, niche: e.target.value})}
                 placeholder="e.g. Real Estate, Coffee Shop, Marketing Agency"
                 className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                 autoFocus
               />
            </div>

            {/* 2. BUSINESS NAME */}
            <div className="border-t border-gray-700 pt-6">
              <label className="block text-lg font-bold text-white mb-4">2. Business Name</label>
              
              <div className="flex bg-gray-900 p-1 rounded-lg mb-4 w-fit border border-gray-700">
                <button 
                  onClick={() => setNameMode('manual')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${nameMode === 'manual' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Enter Manually
                </button>
                <button 
                  onClick={() => setNameMode('generate')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${nameMode === 'generate' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  AI Suggestion
                </button>
              </div>

              {nameMode === 'manual' ? (
                <input 
                  type="text"
                  value={brandProfile.businessName || ''}
                  onChange={(e) => setBrandProfile({...brandProfile, businessName: e.target.value})}
                  placeholder="e.g. Loop Ai"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 space-y-4">
                  <p className="text-gray-400 text-sm">Don't have a name? Let AI suggest some options based on your niche above.</p>
                  
                  {!suggestedNames.length && (
                    <button 
                      onClick={handleNameGeneration}
                      disabled={isGeneratingNames || !brandProfile.niche}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      {isGeneratingNames ? 'Thinking...' : 'Generate Name Ideas'}
                    </button>
                  )}
                  
                  {suggestedNames.length > 0 && (
                     <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">Tap to select:</label>
                        <div className="flex flex-wrap gap-2">
                          {suggestedNames.map((name, i) => (
                             <button 
                                key={i}
                                onClick={() => {
                                  setBrandProfile({...brandProfile, businessName: name});
                                  setLogoGenText(name); 
                                }}
                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${brandProfile.businessName === name ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'}`}
                             >
                               {name}
                             </button>
                          ))}
                        </div>
                        <button onClick={() => { setSuggestedNames([]); handleNameGeneration(); }} className="text-blue-400 text-xs hover:underline mt-2">Generate Different Names</button>
                     </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. LOGO */}
            <div className="border-t border-gray-700 pt-6">
              <label className="block text-lg font-bold text-white mb-4">3. Brand Logo</label>
              <div className="flex bg-gray-900 p-1 rounded-lg mb-4 w-fit border border-gray-700">
                <button 
                  onClick={() => setLogoMode('upload')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${logoMode === 'upload' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Upload File
                </button>
                <button 
                  onClick={() => setLogoMode('generate')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${logoMode === 'generate' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Create with AI
                </button>
              </div>

              {logoMode === 'upload' ? (
                <>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl h-40 flex items-center justify-center cursor-pointer transition-colors ${brandProfile.logoImage ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}`}
                  >
                    {brandProfile.logoImage ? (
                      <img src={brandProfile.logoImage} alt="Logo" className="h-full object-contain p-2" />
                    ) : (
                      <span className="text-gray-400 text-sm">Click to upload Logo</span>
                    )}
                  </div>
                  <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logoImage')} className="hidden" accept="image/*" />
                </>
              ) : (
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Logo Text <span className="text-red-400">(English Only)</span></label>
                    <input 
                      type="text"
                      value={logoGenText}
                      onChange={(e) => setLogoGenText(e.target.value)}
                      placeholder="e.g. Loop Ai"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white outline-none"
                    />
                  </div>
                  <button 
                      onClick={handleLogoGeneration}
                      disabled={isGeneratingLogo || !logoGenText || !brandProfile.niche}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    {isGeneratingLogo ? 'Generating...' : 'Generate Logo'}
                  </button>
                  {brandProfile.logoImage && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600 flex flex-col items-center">
                        <div className="bg-white rounded-lg p-4 w-fit mb-3">
                           <img src={brandProfile.logoImage} alt="Generated Logo" className="h-24 object-contain" />
                        </div>
                        <button onClick={handleDownloadLogo} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold border border-blue-500/30 px-4 py-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                           Download Logo
                        </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. PRODUCT IMAGE */}
            <div className="border-t border-gray-700 pt-6">
              <label className="block text-lg font-bold text-white mb-4">4. Product / Service Image</label>
              <div className="flex bg-gray-900 p-1 rounded-lg mb-4 w-fit border border-gray-700">
                <button 
                  onClick={() => setProductMode('upload')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${productMode === 'upload' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Upload File
                </button>
                <button 
                  onClick={() => setProductMode('generate')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${productMode === 'generate' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Create with AI
                </button>
              </div>

              {productMode === 'upload' ? (
                <>
                  <div 
                    onClick={() => productInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl h-48 flex items-center justify-center cursor-pointer transition-colors ${brandProfile.productImage ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}`}
                  >
                    {brandProfile.productImage ? (
                      <img src={brandProfile.productImage} alt="Product" className="h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-gray-400 text-sm">Click to upload Product/Service Image</span>
                    )}
                  </div>
                  <input type="file" ref={productInputRef} onChange={(e) => handleFileUpload(e, 'productImage')} className="hidden" accept="image/*" />
                </>
              ) : (
                 <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 space-y-4">
                    <textarea 
                      value={productGenDescription}
                      onChange={(e) => setProductGenDescription(e.target.value)}
                      placeholder="Describe the image you want..."
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white outline-none h-24 resize-none"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button 
                         onClick={handlePromptSuggestion}
                         disabled={isGeneratingPrompts || !brandProfile.niche}
                         className="text-xs bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                         {isGeneratingPrompts ? 'Thinking...' : '✨ Suggest Ideas'}
                      </button>
                      {imageSuggestions.map((prompt, idx) => (
                        <button key={idx} onClick={() => setProductGenDescription(prompt)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-3 py-1.5 rounded-full transition-colors truncate max-w-[200px]" title={prompt}>{prompt}</button>
                      ))}
                    </div>
                    <button onClick={handleProductGeneration} disabled={isGeneratingProduct || !productGenDescription || !brandProfile.niche} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 mt-2">
                      {isGeneratingProduct ? 'Generating...' : 'Generate Ad Image'}
                    </button>
                    {brandProfile.productImage && productMode === 'generate' && (
                       <div className="mt-4 border-2 border-purple-500/30 rounded-lg overflow-hidden relative">
                          <img src={brandProfile.productImage} alt="AI Generated Product" className="w-full h-64 object-cover" />
                       </div>
                    )}
                 </div>
              )}
            </div>

            {/* 5. DESCRIPTION */}
            <div className="border-t border-gray-700 pt-6">
               <label className="block text-lg font-bold text-white mb-4">5. Campaign Details (Optional)</label>
               <textarea 
                  value={brandProfile.description}
                  onChange={(e) => setBrandProfile({...brandProfile, description: e.target.value})}
                  placeholder="Details about your offer, sale, or target audience..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
               />
            </div>

            <button 
              onClick={generateCreatives}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Generating Concepts...' : 'Generate Ad Concepts ->'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === AppStep.CREATIVE_GENERATION) {
    return (
      <div className="min-h-screen bg-gray-900 text-white py-10 px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Step 2: Choose Your Creative</h1>
              <p className="text-gray-400">Select a concept below, then generate the final Magic Image.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={generateCreatives} disabled={isLoading} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm">
                {isLoading ? '...' : '🔄 New Concepts'}
              </button>
              <button onClick={() => setStep(AppStep.BRAND_INPUT)} className="text-gray-400 px-4 py-2">← Back</button>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8">
            <div className="space-y-4 order-1 lg:order-1">
               {concepts.map((concept) => (
                 <div 
                   key={concept.id}
                   onClick={() => {
                     setSelectedConcept(concept);
                     setGeneratedImage(null);
                     if (window.innerWidth < 1024) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                   }}
                   className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                     selectedConcept?.id === concept.id ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                   }`}
                 >
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-lg text-white">{concept.headline}</h3>
                     <span className="text-xs font-bold uppercase tracking-wider text-gray-400 border border-gray-600 px-2 py-0.5 rounded-md bg-gray-900">
                       {concept.designVibe}
                     </span>
                   </div>
                   <p className="text-gray-300 text-sm mb-3">{concept.primaryText}</p>
                 </div>
               ))}
            </div>

            <div className="lg:sticky lg:top-10 h-fit order-2 lg:order-2" ref={previewRef}>
              <div className="relative group">
                {isGeneratingImage && (
                  <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border-2 border-purple-500 animate-pulse">
                    <div className="text-5xl mb-4 animate-bounce">✨</div>
                    <p className="text-white font-bold text-xl">Creating Magic...</p>
                  </div>
                )}
                {selectedConcept ? (
                  <CreativePreview 
                    concept={selectedConcept}
                    productImage={brandProfile.productImage}
                    logoImage={brandProfile.logoImage}
                    generatedImage={generatedImage}
                    logoPosition={logoPosition}
                    onLogoMove={setLogoPosition}
                    className="w-full aspect-[4/5] rounded-2xl border border-gray-700"
                  />
                ) : (
                  <div className="w-full aspect-[4/5] bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center text-gray-500">
                    <p>Select a concept to preview</p>
                  </div>
                )}
              </div>
              
              <div className="text-center text-gray-500 text-xs mt-2 italic">
                {selectedConcept && !generatedImage && "Tip: Drag the logo to position it before generating!"}
              </div>

              {selectedConcept && (
                 <button
                   onClick={handleGenerateImage}
                   disabled={isGeneratingImage}
                   className="mt-6 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2"
                 >
                   {isGeneratingImage ? 'Designing...' : (generatedImage ? '🔄 Regenerate Magic Image' : '✨ Generate Magic Image')}
                 </button>
              )}
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setStep(AppStep.FINAL_REVIEW)}
                  disabled={!selectedConcept}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm & Review →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Merged Review & Settings Step
  if (step === AppStep.FINAL_REVIEW) {
    const totalBudget = campaignSettings.budgetAmount * campaignSettings.duration;

    return (
      <div className="min-h-screen bg-gray-900 text-white py-10 px-4 pb-24 flex justify-center">
        <div className="max-w-2xl w-full">
           <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Step 3: Review & Launch</h1>
            <button onClick={() => setStep(AppStep.CREATIVE_GENERATION)} className="text-gray-400 hover:text-white">← Back</button>
          </div>

          <div className="space-y-6">
            {/* 1. AD PREVIEW */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
               <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Final Creative</h3>
               <div className="flex gap-4 items-start">
                  <div className="w-1/3 aspect-[4/5] rounded-lg overflow-hidden border border-gray-700 bg-black">
                    {selectedConcept && (
                      <CreativePreview 
                        concept={selectedConcept}
                        productImage={brandProfile.productImage}
                        logoImage={brandProfile.logoImage}
                        generatedImage={generatedImage}
                        logoPosition={logoPosition}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <div className="w-2/3 space-y-2">
                     <p className="font-bold text-white text-lg">{selectedConcept?.headline}</p>
                     <p className="text-sm text-gray-300">{selectedConcept?.primaryText}</p>
                     <div className="pt-2">
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{selectedConcept?.cta}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. DOWNLOAD ACTION */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
               <button 
                 onClick={handleDownloadImage}
                 className={`w-full font-bold py-4 rounded-xl transition-all border flex items-center justify-center gap-2 ${
                   generatedImage 
                     ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' 
                     : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                 }`}
               >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {generatedImage ? 'Download Image' : 'Generate Image in Step 2 to Download'}
               </button>
            </div>

            {/* 3. CAMPAIGN CONFIGURATION (FORM) */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                   <h3 className="text-xl font-bold text-white">Campaign Configuration</h3>
                </div>

                {/* Auto-Target Toggle */}
                <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Auto-Targeting (AI)</h3>
                    <p className="text-xs text-blue-200">{isAutoTargeting ? 'Generating optimal settings...' : 'Let AI generate the best audience & interests.'}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={autoTargeting} onChange={handleAutoTargetingToggle} disabled={isAutoTargeting} />
                    <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${autoTargeting ? 'peer-checked:bg-blue-600' : ''}`}></div>
                  </label>
                </div>

                {/* Form Fields */}
                <div className={`space-y-5 transition-opacity duration-300 ${isAutoTargeting ? 'opacity-50 pointer-events-none' : ''}`}>
                    
                    {/* Objective */}
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2">Objective</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'SALES'].map(obj => (
                          <button
                            key={obj}
                            onClick={() => setCampaignSettings({...campaignSettings, objective: obj as any})}
                            className={`py-2 px-1 rounded text-[10px] sm:text-xs font-bold border transition-colors truncate ${campaignSettings.objective === obj ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                          >
                            {obj}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location (Map Simulator) */}
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2">Location</label>
                      <div className="relative rounded-lg overflow-hidden border border-gray-600 h-48 bg-gray-900 group">
                         {/* Fake Map Background */}
                         <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] bg-cover bg-center opacity-30"></div>
                         
                         {/* Search Overlay */}
                         <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
                             <input 
                                type="text"
                                value={mapSearch}
                                onChange={(e) => setMapSearch(e.target.value)}
                                placeholder="Search City or Country..."
                                className="w-full bg-gray-800/90 backdrop-blur text-white text-sm px-3 py-2 rounded-lg border border-gray-600 outline-none focus:border-blue-500"
                             />
                             <button onClick={handleMapSearch} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                             </button>
                         </div>

                         {/* Pin Animation */}
                         {(mapPinVisible || campaignSettings.locations) && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                               <svg className="w-8 h-8 text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                               <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1">
                                  {campaignSettings.locations}
                               </span>
                            </div>
                         )}
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Interests</label>
                        <input 
                           type="text" 
                           value={campaignSettings.interests}
                           onChange={e => setCampaignSettings({...campaignSettings, interests: e.target.value})}
                           placeholder="e.g. Marketing, Coffee, Fitness (Comma separated)"
                           className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Age Range</label>
                        <input 
                           type="text" value={campaignSettings.ageRange}
                           onChange={e => setCampaignSettings({...campaignSettings, ageRange: e.target.value})}
                           className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Gender</label>
                        <select 
                           value={campaignSettings.gender}
                           onChange={e => setCampaignSettings({...campaignSettings, gender: e.target.value as any})}
                           className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                        >
                          <option value="ALL">All</option>
                          <option value="MEN">Men</option>
                          <option value="WOMEN">Women</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                         <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                               <label className="block text-sm font-bold text-gray-400 mb-1">Duration (Days)</label>
                               <input 
                                  type="number"
                                  min="1"
                                  value={campaignSettings.duration}
                                  onChange={e => setCampaignSettings({...campaignSettings, duration: Number(e.target.value)})}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                               />
                            </div>
                            <div>
                               <label className="block text-sm font-bold text-gray-400 mb-1">Daily Budget ($)</label>
                               <input 
                                  type="number"
                                  value={campaignSettings.budgetAmount}
                                  onChange={e => setCampaignSettings({...campaignSettings, budgetAmount: Number(e.target.value)})}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                               />
                            </div>
                         </div>
                         
                         {/* TOTAL BUDGET DISPLAY */}
                         <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 flex justify-between items-center">
                            <span className="text-gray-300 font-bold">Total Budget:</span>
                            <span className="text-2xl font-extrabold text-blue-400">${totalBudget}</span>
                         </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <button 
                   onClick={handleSaveSettings}
                   className={`w-full font-bold py-3 rounded-xl transition-all ${isSettingsSaved ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                >
                   {isSettingsSaved ? '✓ Settings Saved' : 'Save Configuration'}
                </button>
            </div>

            {/* 4. LAUNCH ACTION */}
            <button 
               onClick={() => initiateFacebookLogin()}
               disabled={!isSettingsSaved}
               className="w-full bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 mt-4"
            >
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               Connect with Meta to Launch
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Meta Connect & Launch Screens
  if (step === AppStep.META_CONNECT) {
     return <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4"><PortfolioSelector portfolios={portfolios} onSelect={(p) => fetchAssets(p)} /></div>;
  }
  if (step === AppStep.ASSET_SELECTION) {
     return <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4"><div className="w-full max-w-md"><AssetSelector assets={assets} onConfirm={(s) => { setSelectedAssets(s); setTimeout(() => handleLaunch(), 100); }} /></div></div>;
  }
  if (step === AppStep.LAUNCHING) {
     return <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-6"></div><h2 className="text-2xl font-bold text-white">Launching...</h2></div>;
  }
  if (step === AppStep.SUCCESS) {
     return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
           <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center max-w-md w-full">
              <h2 className="text-3xl font-bold text-white mb-2">Campaign Launched!</h2>
              <button onClick={() => setStep(AppStep.LANDING)} className="w-full bg-gray-700 mt-6 hover:bg-gray-600 text-white font-bold py-3 rounded-xl">Create Another</button>
           </div>
        </div>
     );
  }

  return null;
}