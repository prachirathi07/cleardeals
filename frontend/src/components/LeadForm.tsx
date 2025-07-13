'use client';

import { useState } from 'react';
import { LeadData, api } from '../utils/api';
import { Loader2, Zap } from 'lucide-react';

interface LeadFormProps {
  onScoreSubmit: (result: any) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function LeadForm({ onScoreSubmit, onLoadingChange }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadData>({
    phone: '',
    email: '',
    credit_score: 600,
    age_group: '26-35',
    family_background: 'Married',
    income: 500000,
    employment_type: 'Salaried',
    property_type: 'Apartment',
    loan_amount: 3000000,
    down_payment: 600000,
    property_search_frequency: 2,
    budget_tool_usage: 1,
    listing_saves: 3,
    email_clicks: 1,
    whatsapp_interactions: 2,
    time_to_purchase: 8,
    emi_affordability: 2.5,
    job_stability: 4.0,
    comments: '',
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof LeadData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const loadSampleData = async () => {
    try {
      const { sample_lead } = await api.getSampleData();
      setFormData(sample_lead);
      setErrors({});
    } catch (error) {
      console.error('Failed to load sample data:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.consent) newErrors.consent = 'Consent is required';

    // Phone number format
    const phoneRegex = /^\+91-[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Phone number must be in format +91-XXXXXXXXXX';
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Numeric validations
    if (formData.credit_score < 300 || formData.credit_score > 850) {
      newErrors.credit_score = 'Credit score must be between 300 and 850';
    }

    if (formData.income <= 0) {
      newErrors.income = 'Income must be positive';
    }

    if (formData.loan_amount <= 0) {
      newErrors.loan_amount = 'Loan amount must be positive';
    }

    if (formData.down_payment <= 0) {
      newErrors.down_payment = 'Down payment must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    onLoadingChange(true);

    try {
      const result = await api.scoreLead(formData);
      onScoreSubmit(result);
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        phone: '',
        email: '',
        comments: '',
        consent: false,
      }));
      
    } catch (error: any) {
      console.error('Scoring failed:', error);
      alert(`Scoring failed: ${error.message}`);
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  return (
    <div className="card card-animate">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Lead Scoring Form</h2>
        <button
          type="button"
          onClick={loadSampleData}
          className="btn-secondary flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Load Sample
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+91-9876543210"
              />
              <div className="helper-text">Format: +91-XXXXXXXXXX</div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="john.doe@example.com"
              />
              <div className="helper-text">We'll never share your email.</div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Score
              </label>
              <input
                type="number"
                value={formData.credit_score}
                onChange={(e) => handleInputChange('credit_score', parseInt(e.target.value))}
                className={`input-field ${errors.credit_score ? 'border-red-500' : ''}`}
                min="300"
                max="850"
              />
              <div className="helper-text">Range: 300-850</div>
              {errors.credit_score && <p className="text-red-500 text-sm mt-1">{errors.credit_score}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Income (₹)
              </label>
              <input
                type="number"
                value={formData.income}
                onChange={(e) => handleInputChange('income', parseInt(e.target.value))}
                className={`input-field ${errors.income ? 'border-red-500' : ''}`}
                min="0"
              />
              <div className="helper-text">Gross annual income</div>
              {errors.income && <p className="text-red-500 text-sm mt-1">{errors.income}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (₹)
              </label>
              <input
                type="number"
                value={formData.loan_amount}
                onChange={(e) => handleInputChange('loan_amount', parseInt(e.target.value))}
                className={`input-field ${errors.loan_amount ? 'border-red-500' : ''}`}
                min="0"
              />
              <div className="helper-text">Requested loan amount</div>
              {errors.loan_amount && <p className="text-red-500 text-sm mt-1">{errors.loan_amount}</p>}
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Group
              </label>
              <select
                value={formData.age_group}
                onChange={(e) => handleInputChange('age_group', e.target.value)}
                className="input-field"
              >
                <option value="18-25">18-25</option>
                <option value="26-35">26-35</option>
                <option value="36-50">36-50</option>
                <option value="51+">51+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Background
              </label>
              <select
                value={formData.family_background}
                onChange={(e) => handleInputChange('family_background', e.target.value)}
                className="input-field"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => handleInputChange('employment_type', e.target.value)}
                className="input-field"
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business Owner">Business Owner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Property & Intent</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={formData.property_type}
                onChange={(e) => handleInputChange('property_type', e.target.value)}
                className="input-field"
              >
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Plot">Plot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Down Payment (₹)
              </label>
              <input
                type="number"
                value={formData.down_payment}
                onChange={(e) => handleInputChange('down_payment', parseInt(e.target.value))}
                className={`input-field ${errors.down_payment ? 'border-red-500' : ''}`}
                min="0"
              />
              <div className="helper-text">Amount ready for down payment</div>
              {errors.down_payment && <p className="text-red-500 text-sm mt-1">{errors.down_payment}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time to Purchase (months)
              </label>
              <input
                type="number"
                value={formData.time_to_purchase}
                onChange={(e) => handleInputChange('time_to_purchase', parseInt(e.target.value))}
                className="input-field"
                min="0"
              />
              <div className="helper-text">Expected time to buy</div>
            </div>
          </div>
        </div>

        {/* Engagement & Affordability */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Engagement & Affordability</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Search Frequency
              </label>
              <input
                type="number"
                value={formData.property_search_frequency}
                onChange={(e) => handleInputChange('property_search_frequency', parseInt(e.target.value))}
                className="input-field"
                min="0"
              />
              <div className="helper-text">Site visits/month</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Tool Usage
              </label>
              <input
                type="number"
                value={formData.budget_tool_usage}
                onChange={(e) => handleInputChange('budget_tool_usage', parseInt(e.target.value))}
                className="input-field"
                min="0"
              />
              <div className="helper-text">Times used</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Saves
              </label>
              <input
                type="number"
                value={formData.listing_saves}
                onChange={(e) => handleInputChange('listing_saves', parseInt(e.target.value))}
                className="input-field"
                min="0"
              />
              <div className="helper-text">Properties saved</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Clicks
              </label>
              <input
                type="number"
                value={formData.email_clicks}
                onChange={(e) => handleInputChange('email_clicks', parseInt(e.target.value))}
                className="input-field"
                min="0"
              />
              <div className="helper-text">Marketing emails clicked</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Interactions
              </label>
              <input
                type="number"
                value={formData.whatsapp_interactions}
                onChange={(e) => handleInputChange('whatsapp_interactions', parseInt(e.target.value))}
                className="input-field"
                min="0"
              />
              <div className="helper-text">Chats with sales</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EMI Affordability (Lakh ₹)
              </label>
              <input
                type="number"
                value={formData.emi_affordability}
                onChange={(e) => handleInputChange('emi_affordability', parseFloat(e.target.value))}
                className="input-field"
                min="0"
                step="0.1"
              />
              <div className="helper-text">Max EMI affordable</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Stability (years)
              </label>
              <input
                type="number"
                value={formData.job_stability}
                onChange={(e) => handleInputChange('job_stability', parseFloat(e.target.value))}
                className="input-field"
                min="0"
                step="0.1"
              />
              <div className="helper-text">Years in current job</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Any additional info or context..."
              />
              <div className="helper-text">Optional, but helps improve scoring</div>
            </div>
          </div>
        </div>

        {/* Consent */}
        <div className="flex items-center mt-8">
          <input
            type="checkbox"
            checked={formData.consent}
            onChange={(e) => handleInputChange('consent', e.target.checked)}
            className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-2"
            id="consent-checkbox"
          />
          <label htmlFor="consent-checkbox" className="text-sm text-gray-700">
            I consent to my data being used for lead scoring and compliance purposes. *
          </label>
        </div>
        {errors.consent && <p className="text-red-500 text-sm mt-1">{errors.consent}</p>}

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className={`btn-primary flex items-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Score Lead
          </button>
        </div>
      </form>
    </div>
  );
} 