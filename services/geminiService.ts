import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, AdConcept, LogoPosition, CampaignSettings } from "../types";

const getApiKey = (): string | undefined => {
  try {
    // Browser runtime config (index.html sets window._env_)
    if (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_.API_KEY) {
      return (window as any)._env_.API_KEY;
    }
  } catch (e) {}

  try {
    // Node / Vite env (safe access)
    if (typeof process !== 'undefined' && (process as any).env && (process as any).env.API_KEY) {
      return (process as any).env.API_KEY;
    }
  } catch (e) {}

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
      return (import.meta as any).env.VITE_API_KEY;
    }
  } catch (e) {}

  return undefined;
};

let _aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!_aiInstance) {
    const apiKey = getApiKey();
    _aiInstance = new GoogleGenAI({ apiKey });
  }
  return _aiInstance as GoogleGenAI;
};

export const generateBusinessNames = async (niche: string): Promise<string[]> => {
  try {
    const prompt = `
      Generate 5 catchy, modern, and professional business names for a "${niche}" business.
      Return a simple JSON object with a key "names" containing an array of strings.
      Do not include explanations.
    `;

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            names: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return parsed.names || [];
    }
    return [];
  } catch (error) {
    console.error("Name Gen Error:", error);
    return ["Apex Solutions", "Nova Ventures", "Prime Service", "Loop Innovation", "Core Systems"]; // Fallback
  }
};

export const generateImagePrompts = async (niche: string): Promise<string[]> => {
  try {
    const prompt = `
      Generate 3 distinct, high-quality advertising image descriptions for a "${niche}" business.
      These descriptions will be used to generate images via AI.
      Focus on different angles: one product-focused, one lifestyle/action, and one minimal/artistic.
      Keep them concise but visual (e.g., "A modern minimalist coffee cup on a wooden table with steam rising").
      Return a simple JSON object with a key "prompts" containing an array of strings.
    `;

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return parsed.prompts || [];
    }
    return [];
  } catch (error) {
    console.error("Prompt Gen Error:", error);
    return [
      `Professional shot of a ${niche} service in action`,
      `Minimalist composition representing ${niche}`,
      `High-quality product display for ${niche}`
    ];
  }
};

export const generateLogo = async (businessName: string, niche: string): Promise<string> => {
  try {
    const prompt = `
      Design a professional, modern, and minimalist logo.
      Business Name / Text to Display: "${businessName}".
      Business Type / Niche: ${niche}.
      
      CRITICAL REQUIREMENTS:
      1. TEXT: The logo MUST display the text "${businessName}" clearly.
      2. LANGUAGE: Use ENGLISH ALPHABET ONLY. Do NOT use Arabic, Cyrillic, or any other script.
      3. BACKGROUND: Pure white background (#FFFFFF).
      4. STYLE: High contrast, vector-style aesthetic, clean lines.
      5. QUALITY: High resolution, professional branding.
    `;

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const candidate = response.candidates?.[0]?.content?.parts;
    if (candidate) {
      for (const part of candidate) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    console.warn("Logo Generation Response:", response);
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Logo Gen Error:", error);
    throw error;
  }
};

export const generateProductImage = async (description: string, niche: string): Promise<string> => {
  try {
    const prompt = `
      Create a high-quality, photorealistic advertising image for a business in the "${niche}" industry.
      Subject: ${description}
      Style: Commercial Photography, Professional Lighting, Clean Composition, No Text Overlays.
      Aspect Ratio: Vertical Portrait (3:4).
    `;

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    const candidate = response.candidates?.[0]?.content?.parts;
    if (candidate) {
      for (const part of candidate) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Product Image Gen Error:", error);
    throw error;
  }
};

export const generateTargetingSuggestions = async (profile: BrandProfile): Promise<Partial<CampaignSettings>> => {
  try {
    const prompt = `
      You are a Meta Ads Expert.
      Based on the following business profile, suggest the best targeting settings.
      
      Business: ${profile.businessName}
      Niche: ${profile.niche}
      Description: ${profile.description}
      
      Return a JSON object with:
      - objective: One of ['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'SALES']
      - locations: A suggested country or major city (e.g. "United States" or "Dubai")
      - ageRange: e.g. "18-45"
      - gender: One of ['ALL', 'MEN', 'WOMEN']
      - interests: A comma-separated string of interest keywords (e.g. "Marketing, Small Business, Technology")
    `;

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objective: { type: Type.STRING },
            locations: { type: Type.STRING },
            ageRange: { type: Type.STRING },
            gender: { type: Type.STRING },
            interests: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    }
    return {};
  } catch (e) {
    console.error("Targeting Gen Error", e);
    return {
      objective: 'TRAFFIC',
      locations: 'United States',
      ageRange: '18-65',
      gender: 'ALL',
      interests: 'General'
    };
  }
};

export const generateAdConcepts = async (
  profile: BrandProfile
): Promise<AdConcept[]> => {
  try {
    const description = profile.description || `A premium service/product in the ${profile.niche || 'general'} industry.`;
    const niche = profile.niche || 'General Business';
    const audience = profile.targetAudience || 'General Public';

    const prompt = `
      You are a Creative Director.
      Client: ${profile.businessName || 'The Brand'} (${niche}).
      Client Description/Offer: "${description}".
      Target Audience: "${audience}".

      Task: Generate 3 distinct ad concepts for Meta Ads.
      
      CRITICAL LANGUAGE INSTRUCTION:
      - Detect the language of the "Client Description/Offer".
      - The 'headline', 'primaryText', and 'cta' MUST be in that SAME language. 
      - Example: If description is "وجبة برجر ب 5 دنانير", output Arabic text for headline/copy.
      - Example: If description is "Burger meal for $5", output English text.
      - If the description is mixed or unclear, use the language that best fits the target audience, but prioritize the input language.
      
      Return JSON with: headline, primaryText, cta, visualDescription, designVibe, colorHex.
    `;

    const parts: any[] = [{ text: prompt }];
    if (profile.productImage) {
      parts.unshift({
        inlineData: {
          mimeType: "image/png",
          data: profile.productImage.split(',')[1],
        },
      });
    }

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  primaryText: { type: Type.STRING },
                  cta: { type: Type.STRING },
                  visualDescription: { type: Type.STRING },
                  designVibe: { type: Type.STRING },
                  colorHex: { type: Type.STRING }
                },
                required: ["headline", "primaryText", "cta", "visualDescription", "designVibe", "colorHex"]
              }
            }
          }
        },
      },
    });

    if (response.text) {
      let cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return parsed.concepts.map((c: any, index: number) => ({ ...c, id: `concept-${index}` }));
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// Helper to translate XY coordinates to natural language for prompt
const getLogoPositionDescription = (pos?: LogoPosition): string => {
  if (!pos) return "TOP-LEFT corner";
  
  // Calculate specific percentages for more precision if needed by model
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
    const positionText = getLogoPositionDescription(logoPosition);
    
    const prompt = `
      Create a FINAL Advertising Image Composite.
      
      CORE INSTRUCTION: You are merging a Product Image and a Logo into a single professional ad.
      
      1. COMPOSITION:
         - Main Subject: The product must be central, well-lit, Vertical Portrait (3:4 ratio).
         - LOGO PLACEMENT: The logo MUST be placed in the ${positionText} area.
           - Specific Coordinates Instruction: The user wants the logo roughly at ${logoPosition?.y || 5}% from top and ${logoPosition?.x || 5}% from left.
           - CRITICAL: Do not place it right on the edge. Leave professional padding/margin.
           - CRITICAL: The logo size must be small and subtle (like a brand watermark).
           - Align it neatly so it looks "organized" and intentional.
      
      2. STYLE:
         - ${concept.designVibe} aesthetic.
         - Color palette matching: ${concept.colorHex}.
         - Lighting: Ensure the logo has appropriate lighting (shadow/highlight) so it looks merged, not pasted.
      
      3. VISUAL: ${concept.visualDescription}
    `;

    const parts: any[] = [{ text: prompt }];

    if (productImageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: productImageBase64.split(',')[1],
        },
      });
    }

    if (logoImageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: logoImageBase64.split(',')[1],
        },
      });
    }

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    const candidate = response.candidates?.[0]?.content?.parts;
    if (candidate) {
      for (const part of candidate) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};