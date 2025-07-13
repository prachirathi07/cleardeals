'use client';

import { useState, useEffect } from 'react';
import LeadForm from '../components/LeadForm';
import LeadsTable from '../components/LeadsTable';
import { api } from '../utils/api';
import { CheckCircle, AlertCircle, Brain, Zap } from 'lucide-react';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      await api.healthCheck();
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const handleScoreSubmit = (result: any) => {
    setLastResult(result);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLoadingChange = (loading: boolean) => {
    setLoading(loading);
  };

  return (
    <div className="min-h-screen bg-gradient">
      {/* Header */}
      <header className="bg-white sticky-header shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg shadow">
                <Brain className="w-10 h-10 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Lead Scoring Dashboard</h1>
                <p className="text-base text-gray-600 mt-1">Real estate lead scoring using ML and rule-based reranking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {apiStatus === 'checking' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                )}
                {apiStatus === 'online' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {apiStatus === 'offline' && <AlertCircle className="w-4 h-4 text-red-500" />}
                <span className={`text-sm ${apiStatus === 'online' ? 'text-green-600' : apiStatus === 'offline' ? 'text-red-600' : 'text-gray-600'}`}>
                  API {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Last Result */}
          {lastResult && (
            <div className="card card-animate border-l-4 border-primary-500">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest Score Result</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Initial Score</p>
                      <p className="text-2xl font-bold text-gray-900">{lastResult.initial_score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Final Score</p>
                      <p className="text-2xl font-bold text-primary-600">{lastResult.reranked_score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Intent Level</p>
                      <p className="text-2xl font-bold text-gray-900">{lastResult.intent_level}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{lastResult.explanation}</p>
                </div>
                <button
                  onClick={() => setLastResult(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  title="Dismiss"
                >
                   d7
                </button>
              </div>
            </div>
          )}

          {/* Form and Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Lead Form */}
            <div className="card card-animate">
              <LeadForm 
                onScoreSubmit={handleScoreSubmit}
                onLoadingChange={handleLoadingChange}
              />
            </div>

            {/* Leads Table */}
            <div className="card card-animate">
              <LeadsTable refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* Features Section */}
          <div className="card card-animate">
            <h2 className="text-xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center shadow">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">ML Model</h3>
                <p className="text-sm text-gray-600">
                  XGBoost algorithm analyzes lead characteristics to generate initial intent scores
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center shadow">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Rule-Based Reranker</h3>
                <p className="text-sm text-gray-600">
                  Adjusts scores based on comments using keyword analysis and contextual signals
                </p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center shadow">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Scoring</h3>
                <p className="text-sm text-gray-600">
                  Instant scoring with API latency under 300ms for optimal user experience
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center py-6 text-gray-400 border-t border-gray-200 mt-12">
            <p className="text-sm">
              Built by <span className="font-medium text-primary-600">Prachi Rathi</span> for ClearDeals AI Engineer Intern Position
            </p>
            <p className="text-xs mt-1">
              Technologies: Next.js, FastAPI, XGBoost, Tailwind CSS
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
} 