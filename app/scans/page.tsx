'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navigation from "@/components/Navigation";

interface Scan {
  id: string;
  date: string;
  prompt: string;
  engines: string[];
  brandMentions: number;
  visibility: string;
  sentiment: string;
  competitors: string[];
}

export default function ScansPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const scansQuery = query(
          collection(db, 'scans'),
          orderBy('createdAt', 'desc')
        );
        
        const scansSnapshot = await getDocs(scansQuery);
        
        const scansData: Scan[] = await Promise.all(scansSnapshot.docs.map(async (scanDoc) => {
          // For each scan, get the responses
          const responsesQuery = query(
            collection(db, 'responses'),
            orderBy('timestamp', 'desc')
          );
          
          // Get response data
          const responsesSnapshot = await getDocs(responsesQuery);
          const responses = responsesSnapshot.docs
            .filter(doc => doc.data().scanId === scanDoc.id)
            .map(doc => ({
              ...doc.data(),
            }));
          
          // Count brand mentions across all responses
          const brandMentions = responses.reduce((sum, response) => {
            return sum + (response.brandMentions?.count || 0);
          }, 0);
          
          // Calculate visibility percentage
          const totalPossibleMentions = responses.length;
          const visibility = totalPossibleMentions > 0 
            ? (brandMentions / totalPossibleMentions * 100).toFixed(1) + '%'
            : '0.0%';
            
          // Determine overall sentiment
          let overallSentiment = 'Not mentioned';
          if (brandMentions > 0) {
            const sentimentCounts = {
              positive: 0,
              neutral: 0,
              negative: 0
            };
            
            responses.forEach(response => {
              if (response.brandMentions?.sentiment) {
                sentimentCounts[response.brandMentions.sentiment as keyof typeof sentimentCounts]++;
              }
            });
            
            if (sentimentCounts.positive > sentimentCounts.neutral && sentimentCounts.positive > sentimentCounts.negative) {
              overallSentiment = 'Positive';
            } else if (sentimentCounts.negative > sentimentCounts.neutral && sentimentCounts.negative > sentimentCounts.positive) {
              overallSentiment = 'Negative';
            } else {
              overallSentiment = 'Neutral';
            }
          }
          
          // Get unique engines
          const engines = [...new Set(responses.map(r => r.engineName || ''))].filter(Boolean);
          
          // Get competitors from the scan
          const competitors = scanDoc.data().competitors || [];
          
          // Format date
          const createdAt = scanDoc.data().createdAt?.toDate?.() 
            ? scanDoc.data().createdAt.toDate()
            : new Date();
          
          return {
            id: scanDoc.id,
            date: createdAt.toISOString().split('T')[0],
            prompt: scanDoc.data().prompt || 'Unknown query',
            engines,
            brandMentions,
            visibility,
            sentiment: overallSentiment,
            competitors
          };
        }));
        
        setScans(scansData);
      } catch (error) {
        console.error('Error fetching scans:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScans();
  }, []);

  // Filter and sort scans
  const filteredScans = scans
    .filter(scan => {
      return (
        scan.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.competitors.some(comp => comp.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date);
      } else if (sortField === 'brandMentions') {
        return sortDirection === 'asc' 
          ? a.brandMentions - b.brandMentions
          : b.brandMentions - a.brandMentions;
      } else if (sortField === 'visibility') {
        const aValue = parseFloat(a.visibility);
        const bValue = parseFloat(b.visibility);
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  // Handle sort click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
      </svg>
    ) : (
      <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header and search */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Scan History</h1>
                <p className="text-sm text-gray-500">View and analyze your previous AI scan results</p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center">
                <div className="relative mr-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Search scans"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Link
                  href="/prompt-builder"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  New Scan
                </Link>
              </div>
            </div>
          </div>

          {/* Scan table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading scans...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Date {getSortIcon('date')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prompt
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Engines
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('brandMentions')}
                      >
                        <div className="flex items-center">
                          Brand Mentions {getSortIcon('brandMentions')}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('visibility')}
                      >
                        <div className="flex items-center">
                          Visibility {getSortIcon('visibility')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sentiment
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredScans.length > 0 ? (
                      filteredScans.map((scan) => (
                        <tr key={scan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scan.date}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {scan.prompt}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {scan.engines.map((engine, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {engine}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scan.brandMentions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scan.visibility}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                scan.sentiment === 'Positive' ? 'bg-green-100 text-green-800' : 
                                scan.sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {scan.sentiment}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <Link href={`/scans/detail?id=${scan.id}`} className="text-blue-600 hover:text-blue-800 px-2">
                              View
                            </Link>
                            <button className="text-gray-600 hover:text-gray-800 px-2">
                              Export
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          {searchTerm ? (
                            <>
                              <p className="text-lg font-medium">No results found</p>
                              <p className="text-sm">Try adjusting your search term</p>
                            </>
                          ) : (
                            <>
                              <p className="text-lg font-medium">No scans yet</p>
                              <p className="text-sm mb-4">Create your first scan to get started</p>
                              <Link
                                href="/prompt-builder"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Create Scan
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 