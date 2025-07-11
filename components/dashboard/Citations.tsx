"use client";

import React from "react";
import { PromptResult, Citation } from "@/types/PromptResult";

interface CitationsProps {
  prompts: PromptResult[];
}

const Citations: React.FC<CitationsProps> = ({ prompts }) => {
  // Extract and deduplicate citations
  const allCitations = prompts
    .flatMap((p) => p.citation || [])
    .filter((c) => c && c.url);

  const citationMap = new Map<string, Citation & { count: number }>();
  allCitations.forEach((c) => {
    const key = c.url;
    if (!citationMap.has(key)) {
      citationMap.set(key, { ...c, count: 1 });
    } else {
      citationMap.get(key)!.count += 1;
    }
  });
  const uniqueCitations = Array.from(citationMap.values());

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Citations</h2>
      <p className="text-sm text-gray-600 mb-4">
        Sources referenced in the analysis, with links to the original content.
      </p>
      {uniqueCitations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">URL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Mentions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uniqueCitations.map((c) => (
                <tr key={c.url}>
                  <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-grey-600 hover:underline block truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]"
                      title={c.title || c.url}
                    >
                      {c.title || c.url}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 sm:px-6">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]"
                      title={c.url}
                    >
                      {c.url}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No citations found in this report.</p>
      )}
    </div>
  );
};

export default Citations;