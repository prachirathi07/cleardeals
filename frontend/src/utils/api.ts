const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LeadData {
  phone: string;
  email: string;
  credit_score: number;
  age_group: string;
  family_background: string;
  income: number;
  employment_type: string;
  property_type: string;
  loan_amount: number;
  down_payment: number;
  property_search_frequency?: number;
  budget_tool_usage?: number;
  listing_saves?: number;
  email_clicks?: number;
  whatsapp_interactions?: number;
  time_to_purchase?: number;
  emi_affordability?: number;
  job_stability?: number;
  comments?: string;
  consent: boolean;
}

export interface LeadResponse {
  initial_score: number;
  reranked_score: number;
  intent_level: string;
  explanation: string;
  hashed_email: string;
  hashed_phone: string;
  timestamp: string;
  error?: string;
}

export interface LeadRecord {
  id: string;
  email: string;
  phone: string;
  initial_score: number;
  reranked_score: number;
  intent_level: string;
  comments: string;
  timestamp: string;
}

export interface StatsResponse {
  total_leads: number;
  average_initial_score: number;
  average_reranked_score: number;
  intent_distribution: Record<string, number>;
  model_loaded: boolean;
  feature_importance: Record<string, number>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText);
  }

  return response.json();
}

export const api = {
  // Score a new lead
  async scoreLead(data: LeadData): Promise<LeadResponse> {
    return apiRequest<LeadResponse>('/score', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all scored leads
  async getLeads(): Promise<LeadRecord[]> {
    return apiRequest<LeadRecord[]>('/leads');
  },

  // Get statistics
  async getStats(): Promise<StatsResponse> {
    return apiRequest<StatsResponse>('/stats');
  },

  // Health check
  async healthCheck(): Promise<{ status: string; model_status: string }> {
    return apiRequest<{ status: string; model_status: string }>('/health');
  },

  // Get sample data
  async getSampleData(): Promise<{ sample_lead: LeadData }> {
    return apiRequest<{ sample_lead: LeadData }>('/sample-data');
  },
}; 