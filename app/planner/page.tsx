"use client";

import React, { useState } from "react";
import { CompanyProfile } from "@/types/CompanyProfile";
import { DialogueTurn } from "@/types/Planner";
import { RedditThread } from "@/types/RedditThread";

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

export default function PlannerPage() {
  const [step, setStep] = useState(0); // 0: profile, 1: generate, 2: export
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: "", companyWebsite: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [planner, setPlanner] = useState< DialogueTurn[]>([]);
  const [dialogueLoading, setDialogueLoading] = useState(false);
  const [dialogueError, setDialogueError] = useState<string | null>(null);

  // Step 1: Company Profile
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
      setCompanyProfile((prev) => ({ ...prev, ...data }));
    } catch (e: any) {
      setProfileError(e.message || "Failed to generate profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Step 2: Generate Dialogues
  const handleGenerateDialogue = async () => {
    setDialogueLoading(true); setDialogueError(null);
    try {
      const res = await fetch("/api/query/company_planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyProfile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate dialogue");
      setPlanner(data);
    } catch (e: any) {
      setDialogueError(e.message || "Failed to generate dialogue");
    } finally {
      setDialogueLoading(false);
    }
  };

  // Step 3: Export
  const handleExport = () => {
    if (!planner) return;
    const lines = planner.map(comment => `${comment.user_handle}: ${comment.comment_text}`);
    const blob = new Blob([
      lines.join("\n")
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyProfile.name || "planner"}_dialogue.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Export as XLSX
  const handleExportXLSX = async () => {
    if (!planner) return;
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(planner.map(comment => ({
      user_handle: comment.user_handle,
      comment_text: comment.comment_text
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Dialogue");
    const wbout = xlsx.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyProfile.name || "planner"}_dialogue.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 relative min-h-screen">
      <div className="flex items-center mb-8">
        {["Company Info", "Generate Dialogues", "Export"].map((label, i) => (
          <React.Fragment key={i}>
            <div className={`flex-1 text-center font-semibold ${step === i ? "text-blue-600" : "text-gray-400"}`}>{label}</div>
            {i < 2 && <div className="w-8 h-1 bg-gray-200 mx-2 rounded" />}
          </React.Fragment>
        ))}
      </div>
      {/* Step 1: Company Info */}
      {step === 0 && (
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Step 1: Company Info</h1>
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
      {/* Step 2: Generate Dialogues */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Step 2: Generate Dialogues</h1>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(0)}>Back</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleGenerateDialogue} disabled={dialogueLoading}>
              {dialogueLoading ? "Generating..." : "Generate Dialogues"}
            </button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(2)} disabled={!planner || planner.length === 0}>Next</button>
          </div>
          {dialogueError && <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">{dialogueError}</div>}
          {planner && (
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="font-semibold text-blue-700 mb-4 text-lg">Dialogue</div>
              <div className="flex flex-col gap-5">
                {planner.map((comment, idx) => {
                  const isUser1 = comment.user_handle === "user_1";
                  return (
                    <div key={idx} className={`flex w-full ${isUser1 ? "justify-start" : "justify-end"}`}>
                      {/* Avatar and message bubble */}
                      <div className={`flex items-end ${isUser1 ? "flex-row" : "flex-row-reverse"} gap-2`} style={{ maxWidth: '90%' }}>
                        {/* Avatar */}
                        <div
                          className={`rounded-full w-10 h-10 flex items-center justify-center font-semibold text-base border shadow select-none bg-white`
                            + (isUser1
                              ? " bg-gradient-to-br from-blue-300 to-blue-500 text-blue-900 border-blue-400"
                              : " bg-gradient-to-br from-green-300 to-green-500 text-green-900 border-green-400")
                          }
                          style={{ minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40 }}
                          title={comment.user_handle}
                        >
                          {isUser1 ? "U1" : "U2"}
                        </div>
                        {/* Message bubble */}
                        <div className={`flex flex-col items-${isUser1 ? "start" : "end"}`} style={{ minWidth: 0 }}>
                          <span className="text-xs text-gray-500 mb-1">{comment.user_handle}</span>
                          <span className={`rounded-2xl px-4 py-2 whitespace-pre-line shadow-sm border text-gray-900 break-words"
                            + (isUser1
                              ? " bg-blue-50 border-blue-100"
                              : " bg-green-50 border-green-100")
                          }`} style={{ maxWidth: 320, wordBreak: 'break-word' }}>
                            {comment.comment_text}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Step 3: Export */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Step 3: Export</h1>
          <div className="mb-4">
            <button className="px-4 py-2 bg-gray-200 rounded mr-2" onClick={() => setStep(1)}>Back</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded mr-2" onClick={handleExport}>Export as TXT</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleExportXLSX}>Export as XLSX</button>
          </div>
        </div>
      )}
    </div>
  );
}
