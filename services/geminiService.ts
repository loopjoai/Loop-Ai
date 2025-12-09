import { BrandProfile, AdConcept, LogoPosition, CampaignSettings } from "../types";

// Helper to determine API endpoint
// In development (Vite on 5173), API server runs on 3001
// In production (Vercel), API routes are at /api
const getApiEndpoint = (): string => {
  if (typeof window !== 'undefined') {
    const isDev = window.location.hostname === 'localhost' && window.location.port === '5173';
    return isDev ? 'http://localhost:3001/api/gemini' : '/api/gemini';
  }
  return '/api/gemini'; // Fallback for SSR
};

// Helper function to handle API errors
const handleApiError = (error: any): never => {
  if (error.message?.includes("Authorization")) {
    throw new Error("Authorization failed - please check API key configuration");
  }
  if (error.message?.includes("rate limit")) {
    throw new Error("Rate limit exceeded - please try again in a few moments");
  }
  console.error("API Error:", error);
  throw error;
};

export const generateBusinessNames = async (niche: string): Promise<string[]> => {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "generateBusinessNames", niche }),
    });

    if (!response.ok) {
      const error = await response.json();
      handleApiError(new Error(error.error || "Failed to generate business names"));
    }

    const data = await response.json();
    return data.names || [];
  } catch (error) {
    handleApiError(error);
  }
};

export const generateImagePrompts = async (niche: string): Promise<string[]> => {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "generateImagePrompts", niche }),
    });

    if (!response.ok) {
      const error = await response.json();
      handleApiError(new Error(error.error || "Failed to generate image prompts"));
    }

    const data = await response.json();
    return data.prompts || [];
  } catch (error) {
    handleApiError(error);
  }
};

export const generateLogo = async (businessName: string, niche: string): Promise<string> => {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "generateLogo", brandName: businessName, niche }),
    });

    if (!response.ok) {
      const error = await response.json();
      handleApiError(new Error(error.error || "Failed to generate logo"));
    }

    const data = await response.json();
    return data.description || "";
  } catch (error) {
    handleApiError(error);
  }
};

export const generateProductImage = async (description: string, niche: string): Promise<string> => {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "generateProductImage", brandName: description, niche }),
    });

    if (!response.ok) {
      const error = await response.json();
      handleApiError(new Error(error.error || "Failed to generate product image"));
    }

    const data = await response.json();
    return data.description || "";
  } catch (error) {
    handleApiError(error);
  }
};

export const generateTargetingSuggestions = async (
  profile: BrandProfile
): Promise<Partial<CampaignSettings>> => {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "generateTargetingSuggestions", brandProfile: profile }),
    });

    if (!response.ok) {
      const error = await response.json();
      handleApiError(new Error(error.error || "Failed to generate targeting suggestions"));
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

export const generateAdConcepts = async (
  profile: BrandProfile
): Promise<AdConcept[]> => {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "generateAdConcepts", brandProfile: profile }),
    });

    if (!response.ok) {
      const error = await response.json();
      handleApiError(new Error(error.error || "Failed to generate ad concepts"));
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map((c: any, i: number) => ({ ...c, id: `concept-${i}` })) : [];
  } catch (error) {
    handleApiError(error);
  }
};

// Helper to translate XY coordinates to natural language for prompt
const getLogoPositionDescription = (pos?: LogoPosition): string => {
  if (!pos) return "TOP-LEFT corner";
  
  const vertical = pos.y < 33 ? "TOP" : pos.y > 66 ? "BOTTOM" : "CENTER";
  const horizontal = pos.x < 33 ? "LEFT" : pos.x > 66 ? "RIGHT" : "CENTER";
  
  return `${vertical}-${horizontal}`;
};

export const generateAdVisual = async (
  productImageBase64: string | null,
  logoImageBase64: string | null,
  concept: AdConcept,
  logoPosition?: LogoPosition
): Promise<string> => {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "generateAdVisual",
        logoDescription: logoImageBase64 ? "Logo image provided" : "No logo",
        productDescription: productImageBase64 ? "Product image provided" : "No product",
        adConcept: concept,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      handleApiError(new Error(error.error || "Failed to generate ad visual"));
    }

    const data = await response.json();
    return data.description || "";
  } catch (error) {
    handleApiError(error);
  }
};
