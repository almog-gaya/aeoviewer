'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  showLogo?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ showLogo = true }) => {
  const pathname = usePathname();

  const isActive = (path: string): boolean => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="sidebar w-64 bg-white border-r border-gray-200 min-h-screen fixed">
        <div className="p-4">
          <div className="flex items-center mb-6">
            <svg className="w-6 h-6 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h1 className="text-xl font-medium text-gray-900">AEO Viewer</h1>
          </div>
          
          {/* Dashboard Section */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Dashboard
            </h2>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/dashboard') && !isActive('/dashboard/monitoring')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Main Dashboard
              </Link>  
            </nav>
          </div>
          
          {/* Generate Section */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Generate
            </h2>
            <nav className="space-y-1">
              <Link
                href="/generate-analysis"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/generate-analysis')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Analysis
              </Link>  
            </nav>
          </div>
            
        </div>
      </div>

      {/* Top Header */}
      {/* <div className="flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li>
                    <Link href="/" className="text-gray-600 hover:text-gray-700">
                      Orca Security
                    </Link>
                  </li>
                  <li>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-gray-600 hover:text-gray-700">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                  <li>
                    <span className="text-gray-600">
                      Main Dashboard
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option>Orca Security</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option>Orca Cloud Security Platform</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="text-sm text-gray-700">avishai@demandbox.co</div>
              <button className="text-sm text-gray-700 hover:text-gray-900">Sign out</button>
            </div>
          </div>
        </header>
      </div> */}
    </div>
  );
};

export default Navigation; 