"use client";

import React, { useEffect, useState } from "react";
import { InsightQuery } from "@/types/InsightQuery";
import { PromptResult } from "@/types/PromptResult";
import { CompanyProfile } from "@/types/CompanyProfile";

// Modal for add/edit query
function QueryModal({ open, onClose, onSave, initial }: { open: boolean; onClose: () => void; onSave: (q: InsightQuery) => void; initial?: InsightQuery }) {
  const [query, setQuery] = useState<InsightQuery>(initial || { query_text: "", buyer_persona: "", buying_journey_stage: "" });
  useEffect(() => { setQuery(initial || { query_text: "", buyer_persona: "", buying_journey_stage: "" }); }, [initial, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{initial ? "Edit Query" : "Add Query"}</h2>
        <div className="mb-2">
          <label className="block text-sm font-medium">Query Text</label>
          <textarea className="w-full border rounded p-2" rows={2} value={query.query_text} onChange={e => setQuery(q => ({ ...q, query_text: e.target.value }))} />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Buyer Persona</label>
          <input className="w-full border rounded p-2" value={query.buyer_persona || ""} onChange={e => setQuery(q => ({ ...q, buyer_persona: e.target.value }))} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Buying Journey Stage</label>
          <input className="w-full border rounded p-2" value={query.buying_journey_stage || ""} onChange={e => setQuery(q => ({ ...q, buying_journey_stage: e.target.value }))} />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => { onSave(query); onClose(); }} disabled={!query.query_text.trim()}>Save</button>
        </div>
      </div>
    </div>
  );
}

const companyProfileFields: { key: keyof CompanyProfile; label: string; required?: boolean }[] = [
  { key: "name", label: "Company Name", required: true },
  { key: "companyWebsite", label: "Company Website", required: true },
  { key: "description", label: "Description" },
  { key: "industry", label: "Industry" },
  { key: "competitors", label: "Competitors (comma separated)" },
  { key: "targetAudience", label: "Target Audience" },
  { key: "products", label: "Products" },
  { key: "benefits", label: "Benefits" },
  { key: "values", label: "Values" },
  { key: "regulatoryContext", label: "Regulatory Context" },
  { key: "personas", label: "Personas" },
  { key: "geoSpecificity", label: "Geo Specificity" },
];

export default function GenerateAnalysisPage() {
  // Stepper state
  const [step, setStep] = useState(0); // 0: profile, 1: queries, 2: analysis

  // Step 1: Company Profile
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: "", companyWebsite: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Step 2: Queries
  const [queries, setQueries] = useState<InsightQuery[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditIdx, setModalEditIdx] = useState<number | null>(null);

  // Step 3: Analysis
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PromptResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate company profile
  const handleGenerateProfile = async () => {
    setProfileLoading(true); setProfileError(null);
    try {
      const res = await fetch("/api/query/company_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyProfile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate profile");
      setCompanyProfile((prev) => ({ ...prev, ...data.data }));
    } catch (e: any) {
      setProfileError(e.message || "Failed to generate profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Generate queries
  const handleGenerateQueries = async () => {
    setQueryLoading(true); setQueryError(null);
    try {
      const res = await fetch("/api/query/company_queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyProfile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate queries");
      setQueries(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setQueryError(e.message || "Failed to generate queries");
    } finally {
      setQueryLoading(false);
    }
  };

  // Add/edit/delete query
  const handleSaveQuery = (q: InsightQuery) => {
    if (modalEditIdx !== null) {
      setQueries((prev) => prev.map((item, i) => (i === modalEditIdx ? q : item)));
    } else {
      setQueries((prev) => [...prev, q]);
    }
  };
  const handleEditQuery = (idx: number) => { setModalEditIdx(idx); setModalOpen(true); };
  const handleDeleteQuery = (idx: number) => { setQueries((prev) => prev.filter((_, i) => i !== idx)); };

  // Step 3: Analysis logic
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
      setResults(data);
    } catch (e: any) {
      setError(e.message || "Failed to analyze results.");
    }
  };

  const handleGenerate = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const inputs = queries;
      const res = await fetch("/api/generate_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, companyName: companyProfile.name, companyProfile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResults(data.results);
      await analyzeResults(data.results);
    } catch (e: any) {
      setError(e.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  // Stepper UI
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 relative min-h-screen">
      <div className="flex items-center mb-8">
        {["Company Profile", "Queries", "Analysis"].map((label, i) => (
          <React.Fragment key={i}>
            <div className={`flex-1 text-center font-semibold ${step === i ? "text-blue-600" : "text-gray-400"}`}>{label}</div>
            {i < 2 && <div className="w-8 h-1 bg-gray-200 mx-2 rounded" />}
          </React.Fragment>
        ))}
      </div>
      {/* Step 1: Company Profile */}
      {step === 0 && (
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Step 1: Company Profile</h1>
          <div className="grid grid-cols-1 gap-4 mb-4">
            {companyProfileFields.map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
                {key === "competitors" ? (
                  <input
                    className="w-full border rounded p-2"
                    value={Array.isArray(companyProfile[key]) ? (companyProfile[key] as string[]).join(", ") : (companyProfile[key] || "")}
                    onChange={e => setCompanyProfile(p => ({ ...p, [key]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                  />
                ) : (
                  <input
                    className="w-full border rounded p-2"
                    value={companyProfile[key] || ""}
                    onChange={e => setCompanyProfile(p => ({ ...p, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          {profileError && <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">{profileError}</div>}
          <div className="flex gap-2 mb-8">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleGenerateProfile} disabled={profileLoading}>
              {profileLoading ? "Generating..." : "Generate Company Profile"}
            </button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(1)} disabled={!companyProfile.name || !companyProfile.companyWebsite}>Next</button>
          </div>
        </div>
      )}
      {/* Step 2: Queries */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Step 2: Generate & Manage Queries</h1>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleGenerateQueries} disabled={queryLoading}>
              {queryLoading ? "Generating..." : "Generate Queries"}
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => { setModalEditIdx(null); setModalOpen(true); }}>Add Query</button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(0)}>Back</button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(2)} disabled={queries.length < 2}>Next</button>
          </div>
          {queryError && <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">{queryError}</div>}
          <div className="grid grid-cols-1 gap-3 mb-8">
            {queries.map((q, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border rounded bg-white shadow-sm">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{q.query_text}</div>
                  <div className="text-xs text-gray-400 mt-1">Stage: {q.buying_journey_stage}{q.buyer_persona ? ` | Persona: ${q.buyer_persona}` : ""}</div>
                </div>
                <button className="px-2 py-1 text-blue-600" onClick={() => handleEditQuery(idx)}>Edit</button>
                <button className="px-2 py-1 text-red-600" onClick={() => handleDeleteQuery(idx)}>Delete</button>
              </div>
            ))}
          </div>
          <QueryModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveQuery} initial={modalEditIdx !== null ? queries[modalEditIdx] : undefined} />
        </div>
      )}
      {/* Step 3: Analysis */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Step 3: Generate & Analyze Report</h1>
          <div className="mb-4">
            <button className="px-4 py-2 bg-gray-200 rounded mr-2" onClick={() => setStep(1)}>Back</button>
          </div>
          <div className="mb-8" style={{ maxHeight: "60vh", overflowY: "auto", paddingBottom: "5rem" }}>
            <div className="grid grid-cols-1 gap-4">
              {queries.map((q, idx) => (
                <div key={idx} className="flex flex-col gap-1 w-full p-6 rounded-xl border bg-white shadow-sm max-w-2xl mx-auto">
                  <div className="font-semibold text-lg text-gray-900 leading-snug">{q.query_text}</div>
                  <div className="text-xs text-gray-400 mt-1">Stage: {q.buying_journey_stage}{q.buyer_persona ? ` | Persona: ${q.buyer_persona}` : ""}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="fixed left-0 right-0 bottom-0 z-50 flex justify-center pointer-events-none" style={{ maxWidth: "768px", margin: "0 auto" }}>
            <button
              className={`pointer-events-auto py-3 px-8 mb-4 rounded-full font-semibold text-white shadow-lg transition-all duration-150 ${
                queries.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
              } text-lg`}
              style={{ minWidth: "220px" }}
              disabled={queries.length === 0 || loading}
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
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
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
                        <div className="text-gray-600">{typeof r.solution_analysis === "string" ? r.solution_analysis : JSON.stringify(r.solution_analysis)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}