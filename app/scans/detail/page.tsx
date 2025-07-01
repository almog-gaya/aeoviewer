'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AIResponseCard from "@/components/AIResponseCard";
import Navigation from "@/components/Navigation";

type Sentiment = 'positive' | 'neutral' | 'negative';

interface Competitor {
  name: string;
  count: number;
  sentiment: Sentiment;
}

interface BrandMention {
  count: number;
  positions: number[];
  sentiment: Sentiment;
}

interface AIResponse {
  id?: string;
  engineName: string;
  response: string;
  brandMentions: BrandMention;
  competitors: Competitor[];
  timestamp: string;
}

interface ScanData {
  id: string;
  prompt: string;
  brand: string;
  competitors: string[];
  createdAt: string;
  responses: AIResponse[];
}

export default function ScanDetailPage() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get('id');
  
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // First try to get the scan data from the URL parameter
    const fetchScanFromFirebase = async (id: string) => {
      try {
        // Get scan document
        const scanDoc = await getDoc(doc(db, 'scans', id));
        
        if (!scanDoc.exists()) {
          console.error('Scan not found');
          return null;
        }
        
        // Get responses for this scan
        const responsesQuery = query(
          collection(db, 'responses'),
          where('scanId', '==', id)
        );
        
        const responsesSnapshot = await getDocs(responsesQuery);
        const responses: AIResponse[] = responsesSnapshot.docs.map(doc => ({
          id: doc.id,
          engineName: doc.data().engineName || '',
          response: doc.data().response || '',
          brandMentions: doc.data().brandMentions || { 
            count: 0, 
            positions: [], 
            sentiment: 'neutral' as Sentiment 
          },
          competitors: doc.data().competitors || [],
          // Ensure timestamp is in string format
          timestamp: doc.data().timestamp?.toDate?.() 
            ? doc.data().timestamp.toDate().toISOString() 
            : (doc.data().timestamp || new Date().toISOString())
        }));
        
        // Format scan data
        const scanData: ScanData = {
          id: scanDoc.id,
          prompt: scanDoc.data().prompt || '',
          brand: scanDoc.data().brand || '',
          competitors: scanDoc.data().competitors || [],
          createdAt: scanDoc.data().createdAt?.toDate?.() 
            ? scanDoc.data().createdAt.toDate().toISOString() 
            : (scanDoc.data().createdAt || new Date().toISOString()),
          responses
        };
        
        return scanData;
      } catch (error) {
        console.error('Error fetching scan data from Firestore:', error);
        return null;
      }
    };

    const loadScanData = async () => {
      // If scanId is in the URL, try to fetch it from Firebase
      if (scanId) {
        const data = await fetchScanFromFirebase(scanId);
        if (data) {
          setScanData(data);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to session storage if Firebase fetch fails or no scanId in URL
      const storedScan = sessionStorage.getItem('latestScan');
      
      if (storedScan) {
        try {
          const parsedScan = JSON.parse(storedScan);
          setScanData(parsedScan);
        } catch (error) {
          console.error('Error parsing stored scan data:', error);
        }
      }
      
      setLoading(false);
    };
    
    loadScanData();
  }, [scanId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading scan results...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">No scan data found.</p>
            <Link
              href="/prompt-builder"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create a New Scan
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  const totalMentions = scanData.responses.reduce((sum, r) => sum + r.brandMentions.count, 0);
  const positiveMentions = scanData.responses.filter(r => r.brandMentions.sentiment === 'positive').length;
  const competitorMentions = scanData.responses.reduce((sum, r) => sum + r.competitors.reduce((s, c) => s + c.count, 0), 0);
  
  const filteredResponses = activeTab === 'all' 
    ? scanData.responses 
    : scanData.responses.filter(r => 
        activeTab === 'mentioned' 
          ? r.brandMentions.count > 0 
          : r.brandMentions.count === 0
      );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Link href="/scans" className="text-blue-600 hover:text-blue-800 mr-2">
                ← Back to Scans
              </Link>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Results</h2>
                <p className="text-gray-600 mb-2">{scanData.prompt}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Brand: {scanData.brand}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Date: {new Date(scanData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Report
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                      <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Brand Mentions</div>
                      <div className="text-2xl font-bold text-gray-900">{totalMentions}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <div className="p-3 bg-green-100 rounded-full mr-4">
                      <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Positive Sentiment</div>
                      <div className="text-2xl font-bold text-gray-900">{positiveMentions} of {scanData.responses.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                    <div className="p-3 bg-purple-100 rounded-full mr-4">
                      <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Competitor Mentions</div>
                      <div className="text-2xl font-bold text-gray-900">{competitorMentions}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('all')}
              >
                All Responses ({scanData.responses.length})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'mentioned' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('mentioned')}
              >
                Brand Mentioned ({scanData.responses.filter(r => r.brandMentions.count > 0).length})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'notmentioned' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('notmentioned')}
              >
                Not Mentioned ({scanData.responses.filter(r => r.brandMentions.count === 0).length})
              </button>
            </div>
            <div className="space-y-6">
              {filteredResponses.map((response, index) => (
                <AIResponseCard 
                  key={index}
                  engineName={response.engineName}
                  response={response.response}
                  brandMentions={response.brandMentions}
                  competitors={response.competitors}
                  timestamp={response.timestamp}
                />
              ))}
              
              {filteredResponses.length === 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <p className="text-gray-500">No responses match the selected filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 