#!/usr/bin/env node

// Local development API server for testing Gemini API routes
// This mirrors the Vercel API routes for local development

import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env.local` });

const app = express();
const PORT = 3001; // API server runs on 3001

app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
};

// Main API handler
app.post('/api/gemini', async (req, res) => {
  try {
    const { operation, ...params } = req.body;

    switch (operation) {
      case 'generateBusinessNames':
        return await handleGenerateBusinessNames(res, params);
      case 'generateImagePrompts':
        return await handleGenerateImagePrompts(res, params);
      case 'generateLogo':
        return await handleGenerateLogo(res, params);
      case 'generateProductImage':
        return await handleGenerateProductImage(res, params);
      case 'generateAdConcepts':
        return await handleGenerateAdConcepts(res, params);
      case 'generateAdVisual':
        return await handleGenerateAdVisual(res, params);
      case 'generateTargetingSuggestions':
        return await handleGenerateTargetingSuggestions(res, params);
      default:
        return res.status(400).json({ error: 'Unknown operation' });
    }
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
      return res.status(403).json({
        error: 'Authorization failed - please check API key configuration',
        code: 'AUTH_ERROR',
      });
    }

    if (error instanceof Error && error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded - please try again in a few moments',
        code: 'RATE_LIMIT',
      });
    }

    return res.status(500).json({
      error: 'Server error processing your request - please try again',
      code: 'SERVER_ERROR',
    });
  }
});

async function handleGenerateBusinessNames(res, params) {
  const { niche } = params;
  if (!niche) {
    return res.status(400).json({ error: 'niche parameter is required' });
  }

  const prompt = `
    Generate 5 catchy, modern, and professional business names for a "${niche}" business.
    Return a simple JSON object with a key "names" containing an array of strings.
    Do not include explanations.
  `;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          names: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json({ names: parsed.names || [] });
  }

  return res.status(200).json({ names: [] });
}

async function handleGenerateImagePrompts(res, params) {
  const { niche } = params;
  if (!niche) {
    return res.status(400).json({ error: 'niche parameter is required' });
  }

  const prompt = `
    Generate 3 distinct, high-quality advertising image descriptions for a "${niche}" business.
    These descriptions will be used to generate images via AI.
    Focus on different angles: one product-focused, one lifestyle/action, and one minimal/artistic.
    Keep them concise but visual (e.g., "A modern minimalist coffee cup on a wooden table with steam rising").
    Return a simple JSON object with a key "prompts" containing an array of strings.
  `;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json({ prompts: parsed.prompts || [] });
  }

  return res.status(200).json({ prompts: [] });
}

async function handleGenerateLogo(res, params) {
  const { brandName, niche } = params;
  if (!brandName || !niche) {
    return res.status(400).json({ error: 'brandName and niche parameters are required' });
  }

  const prompt = `
    Generate a detailed description for a professional logo for a "${niche}" business called "${brandName}".
    The description should be detailed enough to generate an image from (e.g., colors, style, elements).
    Include text that says "${brandName}" or "${brandName.substring(0, 2).toUpperCase()}" in the center.
    Return a simple JSON object with keys "description" (string).
  `;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
        },
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json({ description: parsed.description || '' });
  }

  return res.status(200).json({ description: '' });
}

async function handleGenerateProductImage(res, params) {
  const { brandName, niche } = params;
  if (!brandName || !niche) {
    return res.status(400).json({ error: 'brandName and niche parameters are required' });
  }

  const prompt = `
    Generate a detailed, vivid description for a high-quality product or service image for "${brandName}", a "${niche}" business.
    The image should showcase the product/service in an appealing, professional context.
    Include lighting, setting, and emotional tone that conveys quality and professionalism.
    Return a simple JSON object with key "description" (string) containing the detailed image description.
  `;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
        },
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json({ description: parsed.description || '' });
  }

  return res.status(200).json({ description: '' });
}

async function handleGenerateAdConcepts(res, params) {
  const { brandProfile } = params;
  if (!brandProfile) {
    return res.status(400).json({ error: 'brandProfile parameter is required' });
  }

  const prompt = `
    Generate 3 distinct advertising concepts for "${brandProfile.name}", a "${brandProfile.niche}" business.
    Brand Description: ${brandProfile.description || 'Not provided'}
    
    For each concept, provide:
    - A compelling headline (max 10 words)
    - Ad copy (2-3 sentences)
    - Call-to-action button text (2-4 words)
    - One key benefit or feature being emphasized
    
    Return a JSON array with 3 objects, each containing keys: "headline", "copy", "cta", "focus"
  `;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            copy: { type: Type.STRING },
            cta: { type: Type.STRING },
            focus: { type: Type.STRING },
          },
        },
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json(Array.isArray(parsed) ? parsed : []);
  }

  return res.status(200).json([]);
}

async function handleGenerateAdVisual(res, params) {
  const { brandName, logoDescription, productDescription, adConcept } = params;
  if (!brandName || !adConcept) {
    return res.status(400).json({
      error: 'brandName and adConcept parameters are required',
    });
  }

  const prompt = `
    Create a detailed description for a complete advertising visual/banner that includes:
    1. Logo: ${logoDescription || 'A professional logo'}
    2. Product/Service: ${productDescription || "The business's offering"}
    3. Headline: "${adConcept.headline}"
    4. Ad Copy: "${adConcept.copy}"
    5. Call-to-Action: "${adConcept.cta}"
    
    Describe how these elements should be arranged, colored, and styled to create a cohesive, professional, and compelling advertisement.
    Return a simple JSON object with key "description" (string) containing the complete visual description.
  `;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
        },
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json({ description: parsed.description || '' });
  }

  return res.status(200).json({ description: '' });
}

async function handleGenerateTargetingSuggestions(res, params) {
  const { brandProfile, platform = 'Meta' } = params;
  if (!brandProfile) {
    return res.status(400).json({ error: 'brandProfile parameter is required' });
  }

  const prompt = `
    Generate ${platform} ad targeting recommendations for "${brandProfile.name}", a "${brandProfile.niche}" business.
    Target audience description: ${brandProfile.targetAudience || 'Not specified'}
    
    Provide targeting suggestions in a JSON object with the following keys:
    - "ageRange": [min, max] (e.g., [25, 55])
    - "interests": array of 5 relevant interests (strings)
    - "behaviors": array of 3 relevant behaviors (strings)
    - "locations": array of 3 geographic locations (strings)
    - "platforms": array of recommended platforms (e.g., ["Facebook", "Instagram"])
    - "budgetSuggestion": suggested daily budget in USD (number)
  `;

  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ageRange: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
          },
          interests: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          behaviors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          locations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          platforms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          budgetSuggestion: { type: Type.NUMBER },
        },
      },
    },
  });

  if (response.text) {
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.status(200).json(parsed);
  }

  return res.status(200).json({});
}

app.listen(PORT, () => {
  console.log(`✨ API Server running at http://localhost:${PORT}`);
});
