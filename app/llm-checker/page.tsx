"use client";

import React, { useState } from "react";

const LLMCheckerPage: React.FC = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<null | "checking" | "found" | "not_found" | "error">(null);
  const [error, setError] = useState<string | null>(null);
  const [llmContent, setLlmContent] = useState<string | null>(null);

  // Utility to normalize and construct URLs
  const normalizeUrl = (path: string, inputUrl: string): string => {
    let domain = inputUrl.trim();
    if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
      domain = `https://${domain}`;
    }
    return new URL(path, domain).toString();
  };

  // Handle checking llm.txt
  const handleCheck = async () => {
    setStatus("checking");
    setError(null);
    setLlmContent(null); // Reset generated content
    try {
      const llmUrl = normalizeUrl("/llm.txt", url);
      const res = await fetch(`/api/llm-checker?url=${encodeURIComponent(llmUrl)}`);
      setStatus(res.ok ? "found" : "not_found");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Unknown error");
    }
  };

  // Handle generating llm.txt from robots.txt
  const handleGenerateRobotsTxt = async () => {
    setStatus("checking");
    setError(null);
    setLlmContent(null); // Reset previous content
    try {
      const robotsUrl = normalizeUrl("/robots.txt", url);
      const res = await fetch(`/api/llm-checker?url=${encodeURIComponent(robotsUrl)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llmContent: "generate" }), // Adjust based on API requirements
      });
      if (!res.ok) {
        throw new Error("Failed to generate llm.txt");
      }
      const data = await res.json();
      setStatus("found");
      setLlmContent(data.llmContent || "Generated llm.txt content not provided by API");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Unknown error");
    }
  };

  // Copy text to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Template copied to clipboard!");
    });
  };

  const defaultLlmTemplate = `# llm.txt
# This file communicates the site's policy regarding AI and LLM crawlers.

User-agent: *
Allow: /

# Disallow specific LLM/AI crawlers
# User-agent: OpenAI
# Disallow: /

# User-agent: Google-Extended
# Disallow: /

# User-agent: Anthropic
# Disallow: /

# User-agent: Perplexity
# Disallow: /
`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-8xl w-full bg-white rounded-2xl  sm:p-8 transition-all duration-300">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          LLM Checker
        </h1>
        <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
          Enter a website URL to check if <code className="font-mono bg-gray-100 px-1 rounded">llm.txt</code> exists at its root, similar to <code className="font-mono bg-gray-100 px-1 rounded">robots.txt</code>.
        </p>

        {/* Input and Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 placeholder-gray-400"
            placeholder="e.g., example.com or https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCheck()}
          />
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            onClick={handleCheck}
            disabled={!url || status === "checking"}
          >
            {status === "checking" ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
                Checking...
              </span>
            ) : (
              "Check"
            )}
          </button>
          <button
            className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            onClick={handleGenerateRobotsTxt}
            disabled={!url || status === "checking"}
            type="button"
          >
            Generate from robots.txt
          </button>
        </div>

        {/* Status Messages */}
        {status === "found" && (
          <div className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 transition-all duration-200">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">
              {llmContent ? "llm.txt generated successfully!" : "llm.txt found at the domain root!"}
            </span>
          </div>
        )}
        {status === "not_found" && (
          <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 transition-all duration-200">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">llm.txt not found at the domain root.</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 transition-all duration-200">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error: {error}</span>
          </div>
        )}

        {/* Generated llm.txt Display */}
        {llmContent && (
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Generated <code className="font-mono bg-gray-100 px-1 rounded">llm.txt</code></h2>
            <div className="relative">
              <textarea
                className="w-full font-mono text-sm bg-gray-100 border border-gray-200 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                rows={10}
                readOnly
                value={llmContent}
              />
              <button
                className="absolute top-3 right-3 bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 text-sm font-medium transition-all duration-200"
                onClick={() => handleCopy(llmContent)}
                type="button"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* LLM.txt Generator Template */}
        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Generate your <code className="font-mono bg-gray-100 px-1 rounded">llm.txt</code></h2>
          <p className="mb-4 text-gray-600 text-sm leading-relaxed">
            If your site doesn't have an <code className="font-mono bg-gray-100 px-1 rounded">llm.txt</code>, use this template to declare your AI/LLM crawling policy. Customize it to suit your needs.
          </p>
          <div className="relative mb-4">
            <textarea
              className="w-full font-mono text-sm bg-gray-100 border border-gray-200 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              rows={10}
              readOnly
              value={defaultLlmTemplate}
              id="llm-txt-template"
            />
            <button
              className="absolute top-3 right-3 bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 text-sm font-medium transition-all duration-200"
              onClick={() => handleCopy(defaultLlmTemplate)}
              type="button"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Place this file at your website's root (e.g., <code className="font-mono bg-gray-100 px-1 rounded">https://yourdomain.com/llm.txt</code>).
          </p>
        </div>
      </div>
    </div>
  );
};

export default LLMCheckerPage;