"use client";

import React, { useEffect, useState } from "react";
import { InsightQuery } from "@/types/InsightQuery";
import { PromptResult } from "@/types/PromptResult";

export default function GenerateAnalysisPage() {
  const [queries, setQueries] = useState<InsightQuery[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PromptResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all queries on mount
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await fetch("/api/product");
        if (!res.ok) throw new Error("Failed to load queries.");
        const data = await res.json();
        setQueries(data);
      } catch {
        setError("Failed to load queries.");
      }
    };
    fetchQueries();
  }, []);

  // Handle selection (max 2)
  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      } else if (prev.length < 2) {
        return [...prev, idx];
      }
      return prev;
    });
  };

  // Analyze results
  const analyzeResults = async (results: PromptResult[]) => {
    if (!results || results.length === 0) {
      setError("No results to analyze.");
      return;
    }

    try {
      const res = await fetch("/api/generate_report/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze results.");

      const analyzedResults: PromptResult[] = data.map((item: any) => ({
        query_text: item.query_text,
        response_text: item.response_text,
        buyer_persona: item.buyer_persona,
        buying_journey_stage: item.buying_journey_stage,
        competitors_list: item.competitors_list,
        answer_engine: item.answer_engine,
        sentiment_score: item.sentiment_score,
        recommended: item.recommended,
        company_mentioned: item.company_mentioned,
        mentioned_companies: item.mentioned_companies,
        rank_list: item.rank_list,
        ranking_position: item.ranking_position,
        solution_analysis: item.solution_analysis,
      }));
      
      setResults(analyzedResults);
      setSelected([]); // Reset selection after analysis
    } catch (e: any) {
      setError(e.message || "Failed to analyze results.");
    }
  };

  // Handle submit
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const inputs = selected.map((i) => queries[i]);
      const res = await fetch("/api/generate_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");

      // Set initial results and trigger analysis
      setResults(data.results);
      await analyzeResults(data.results);
    } catch (e: any) {
      setError(e.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 relative min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Generate AI Analysis</h1>
      <p className="mb-6 text-gray-600">
        Select <span className="font-semibold">2 queries</span> to generate an AI-powered analysis report. Results will appear below.
      </p>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Scrollable queries list */}
      <div className="mb-8" style={{ maxHeight: "60vh", overflowY: "auto", paddingBottom: "5rem" }}>
        <div className="grid grid-cols-1 gap-4">
          {queries.map((q, idx) => (
            <label
              key={idx}
              className={`flex items-start gap-4 p-6 rounded-xl border bg-white shadow-sm cursor-pointer transition-all duration-150 max-w-2xl mx-auto ${
                selected.includes(idx) ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
              } ${selected.length === 2 && !selected.includes(idx) ? "opacity-50 pointer-events-none" : ""}`}
              style={{ alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={selected.includes(idx)}
                onChange={() => toggleSelect(idx)}
                className="mt-1 accent-blue-600 scale-125"
                disabled={selected.length === 2 && !selected.includes(idx)}
                style={{ marginTop: 0 }}
              />
              <div className="flex flex-col gap-1 w-full">
                <div className="font-semibold text-lg text-gray-900 leading-snug">{q.query_text}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Stage: {q.buying_journey_stage}
                  {q.buyer_persona ? ` | Persona: ${q.buyer_persona}` : ""}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Floating button */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 flex justify-center pointer-events-none"
        style={{ maxWidth: "768px", margin: "0 auto" }}
      >
        <button
          className={`pointer-events-auto py-3 px-8 mb-4 rounded-full font-semibold text-white shadow-lg transition-all duration-150 ${
            selected.length === 2 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          } text-lg`}
          style={{ minWidth: "220px" }}
          disabled={selected.length !== 2 || loading}
          onClick={handleGenerate}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Analysis"
          )}
        </button>
      </div>

      {/* Results display */}
      {results && (
        <div className="mt-10 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="mb-2 text-lg font-semibold text-blue-700">{r.query_text}</div>
              <div className="text-gray-800 whitespace-pre-line mb-4">{r.response_text}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                {r.buyer_persona && <div>Persona: {r.buyer_persona}</div>}
                {r.buying_journey_stage && <div>Stage: {r.buying_journey_stage}</div>}
                {r.sentiment_score && <div>Sentiment Score: {r.sentiment_score}</div>}
                {r.company_mentioned && <div>Company Mentioned: {r.company_mentioned}</div>}
                {r.competitors_list && (
                  <div>Competitors: {r.competitors_list.join(", ")}</div>
                )}
                {r.solution_analysis && (
                  <div className="col-span-2 mt-2">
                    <div className="font-semibold">Solution Analysis:</div>
                    <div className="text-gray-600">{r.solution_analysis}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}