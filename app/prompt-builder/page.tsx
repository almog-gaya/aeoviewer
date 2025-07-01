'use client';

import { useState, FormEvent } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Navigation from "@/components/Navigation";

export default function PromptBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    competitors: '',
    persona: '',
    keywords: '',
    prompt_template: 'What are the best {keywords} tools for a {persona}? Please compare features, pricing, and benefits.',
    schedule: 'once',
    ai_engines: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          ai_engines: [...prev.ai_engines, value]
        };
      } else {
        return {
          ...prev,
          ai_engines: prev.ai_engines.filter(engine => engine !== value)
        };
      }
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand || !formData.keywords || !formData.persona || formData.ai_engines.length === 0) {
      alert('Please fill in all required fields and select at least one AI engine.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Process competitors from comma-separated to array
      const competitors = formData.competitors
        .split(',')
        .map(c => c.trim())
        .filter(c => c !== '');
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: formData.brand,
          competitors,
          keywords: formData.keywords,
          persona: formData.persona,
          engines: formData.ai_engines
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan request failed');
      }
      
      const scanResult = await response.json();
      
      // Store result in sessionStorage
      sessionStorage.setItem('latestScan', JSON.stringify(scanResult));
      
      // Redirect to the results page
      router.push('/scans/detail');
    } catch (error) {
      console.error('Error submitting scan:', error);
      alert('Failed to process scan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <main className="flex-grow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Scan</h2>
            <p className="text-gray-600">Set up search prompts to analyze how your brand appears in AI results.</p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Your brand name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="competitors" className="block text-sm font-medium text-gray-700 mb-1">
                    Competitors (comma separated)
                  </label>
                  <input
                    type="text"
                    id="competitors"
                    name="competitors"
                    value={formData.competitors}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Competitor 1, Competitor 2, Competitor 3"
                  />
                </div>

                <div>
                  <label htmlFor="persona" className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer Persona <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="persona"
                    name="persona"
                    value={formData.persona}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a persona</option>
                    <option value="CMO">CMO</option>
                    <option value="CEO">CEO</option>
                    <option value="Marketing Manager">Marketing Manager</option>
                    <option value="Startup Founder">Startup Founder</option>
                    <option value="Customer">End Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Engines to Query <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <EngineCheckbox 
                      id="gpt4" 
                      label="ChatGPT (GPT-4)" 
                      checked={formData.ai_engines.includes('gpt4')}
                      onChange={handleCheckboxChange}
                    />
                    <EngineCheckbox 
                      id="claude" 
                      label="Claude" 
                      checked={formData.ai_engines.includes('claude')}
                      onChange={handleCheckboxChange}
                    />
                    <EngineCheckbox 
                      id="gemini" 
                      label="Google Gemini" 
                      checked={formData.ai_engines.includes('gemini')}
                      onChange={handleCheckboxChange}
                    />
                    <EngineCheckbox 
                      id="perplexity" 
                      label="Perplexity" 
                      checked={formData.ai_engines.includes('perplexity')}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Topic Keywords (comma separated) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="marketing automation, email marketing, CRM"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="prompt_template" className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt Template
                  </label>
                  <textarea
                    id="prompt_template"
                    name="prompt_template"
                    rows={4}
                    value={formData.prompt_template}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use &#123;brand&#125;, &#123;competitors&#125;, &#123;keywords&#125;, and &#123;persona&#125; as placeholders in your template.
                  </p>
                </div>

                <div>
                  <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <select
                    id="schedule"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="once">Run once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Run Scan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

interface EngineCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function EngineCheckbox({ id, label, checked, onChange }: EngineCheckboxProps) {
  return (
    <div className="flex items-center">
      <input
        id={id}
        name="ai_engines"
        type="checkbox"
        value={id}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label htmlFor={id} className="ml-3 block text-sm font-medium text-gray-700">
        {label}
      </label>
    </div>
  );
} 