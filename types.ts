import React from 'react';

declare global {
  interface Window {
    _env_?: {
      FACEBOOK_APP_ID?: string;
      [key: string]: any;
    };
  }
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface BusinessPortfolio {
  id: string;
  name: string;
  verificationStatus: 'verified' | 'unverified';
}

export interface MetaAsset {
  id: string;
  name: string;
  type: 'page' | 'instagram' | 'ad_account';
  accessToken?: string;
}

// --- NEW FLOW TYPES ---

export enum AppStep {
  LANDING,            // Step 0: Welcome Screen
  BRAND_INPUT,        // Step 1: Logo, Product, Description
  CREATIVE_GENERATION,// Step 2: AI generates concepts, user selects one
  FINAL_REVIEW,       // Step 3: Summary, Settings, Download, "Connect to Meta" button
  META_CONNECT,       // Login Popup & Portfolio Selection
  ASSET_SELECTION,    // Select Page/Ad Account
  LAUNCHING,          // API Call in progress
  SUCCESS             // Done
}

export interface LogoPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface BrandProfile {
  businessName?: string;
  productImage: string | null;
  logoImage: string | null;
  description: string;
  niche: string;
  targetAudience: string;
}

export interface AdConcept {
  id: string;
  headline: string;
  primaryText: string;
  cta: string;
  visualDescription: string;
  designVibe: string;
  colorHex: string;
}

export interface CampaignSettings {
  objective: 'AWARENESS' | 'TRAFFIC' | 'ENGAGEMENT' | 'LEADS' | 'SALES';
  budgetType: 'DAILY' | 'LIFETIME';
  budgetAmount: number;
  duration: number; // Days
  currency: string;
  startDate: string;
  endDate: string;
  locations: string;
  ageRange: string; // e.g. "18-65"
  gender: 'ALL' | 'MEN' | 'WOMEN';
  interests: string;
}

export interface AdCampaign {
  objective: string;
  audience: string;
  location: string;
  budget: number;
  duration: number;
}

// Deprecated types kept for compatibility if needed, but mostly replaced
export interface GeneratedContent {
  facebookCaption: string;
  instagramCaption: string;
  hashtags: string[];
  visualPrompt: string;
  designConfig: any;
}

export enum Sender {
  Bot = 'bot',
  User = 'user'
}

export interface Message {
  id: string;
  sender: Sender;
  text?: string;
  component?: React.ReactNode;
  timestamp: Date;
}