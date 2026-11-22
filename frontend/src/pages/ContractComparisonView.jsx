import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  FileText, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function ContractComparisonView({ documents }) {
  const [docAId, setDocAId] = useState(documents[0]?.doc_id || 'DOC-2026-081');
  const [docBId, setDocBId] = useState(documents[1]?.doc_id || 'DOC-2026-094');

  const docA = documents.find(d => d.doc_id === docAId) || documents[0];
  const docB = documents.find(d => d.doc_id === docBId) || documents[1];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Side-by-Side Agreement Clause Comparison
        </h2>
        <p className="text-xs text-slate-400">
          Compare liability terms, indemnity, governing laws, and compliance variances across agreements.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs text-slate-300 font-mono block mb-1.5">Baseline Contract (Document A)</label>
          <select
            value={docAId}
            onChange={(e) => setDocAId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            {documents.map(d => (
              <option key={d.doc_id} value={d.doc_id}>
                {d.doc_id} — {d.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-300 font-mono block mb-1.5">Comparison Target (Document B)</label>
          <select
            value={docBId}
            onChange={(e) => setDocBId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            {documents.map(d => (
              <option key={d.doc_id} value={d.doc_id}>
                {d.doc_id} — {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {docA?.doc_id}
              </span>
              <h3 className="text-sm font-bold text-white mt-1">{docA?.title}</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Risk: {docA?.risk_score}/100
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Document Type</span>
              <span className="text-slate-200">{docA?.document_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Governing Law</span>
              <span className="text-slate-200">{docA?.governing_law}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Liability Cap</span>
              <span className="text-emerald-400 font-bold">{docA?.liability_cap}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Missing Clauses</span>
              <span className="text-slate-300">{docA?.missing_clauses?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Document B Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {docB?.doc_id}
              </span>
              <h3 className="text-sm font-bold text-white mt-1">{docB?.title}</h3>
            </div>
            <span className={`text-xs font-mono font-bold ${docB?.risk_score >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
              Risk: {docB?.risk_score}/100
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Document Type</span>
              <span className="text-slate-200">{docB?.document_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Governing Law</span>
              <span className="text-slate-200">{docB?.governing_law}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Liability Cap</span>
              <span className={docB?.risk_score >= 60 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {docB?.liability_cap}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Missing Clauses</span>
              <span className="text-rose-400 font-bold">{docB?.missing_clauses?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
