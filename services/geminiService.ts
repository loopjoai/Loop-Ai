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
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to generate business names (${response.status})`);
    }

    const data = await response.json();
    return data.names || [];
  } catch (error: any) {
    console.error("generateBusinessNames error:", error);
    throw new Error(error.message || "Failed to generate business names");
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
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to generate image prompts (${response.status})`);
    }

    const data = await response.json();
    return data.prompts || [];
  } catch (error: any) {
    console.error("generateImagePrompts error:", error);
    throw new Error(error.message || "Failed to generate image prompts");
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
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to generate logo (${response.status})`);
    }

    const data = await response.json();
    return data.description || "";
  } catch (error: any) {
    console.error("generateLogo error:", error);
    throw new Error(error.message || "Failed to generate logo");
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
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to generate product image (${response.status})`);
    }

    const data = await response.json();
    return data.description || "";
  } catch (error: any) {
    console.error("generateProductImage error:", error);
    throw new Error(error.message || "Failed to generate product image");
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
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to generate targeting suggestions (${response.status})`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("generateTargetingSuggestions error:", error);
    throw new Error(error.message || "Failed to generate targeting suggestions");
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
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to generate ad concepts (${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map((c: any, i: number) => ({ ...c, id: `concept-${i}` })) : [];
  } catch (error: any) {
    console.error("generateAdConcepts error:", error);
    throw new Error(error.message || "Failed to generate ad concepts");
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
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Failed to generate ad visual (${response.status})`);
    }

    const data = await response.json();
    return data.description || "";
  } catch (error: any) {
    console.error("generateAdVisual error:", error);
    throw new Error(error.message || "Failed to generate ad visual");
  }
};
