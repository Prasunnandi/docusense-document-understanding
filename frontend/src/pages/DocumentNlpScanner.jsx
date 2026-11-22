import React, { useState } from 'react';
import { 
  ScanLine, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  Scale, 
  Layers, 
  ShieldCheck, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { parseContractText } from '../services/api';

const SAMPLE_TEXT = `MASTER PROFESSIONAL SERVICES AGREEMENT

This Agreement is entered into as of May 1, 2026 ("Effective Date"), by and between CyberCore Systems Inc ("Client"), a Delaware corporation, and Algorithmic Dynamics LLC ("Consultant").

1. SCOPE OF SERVICES
Consultant will deliver specialized high-frequency algorithmic execution infrastructure and machine learning telemetry models as defined in attached Statements of Work.

2. CONFIDENTIALITY
Each party agrees that all technical data, model architectures, and proprietary customer records disclosed hereunder shall be kept in strict confidence and protected using at least reasonable care.

3. INTELLECTUAL PROPERTY RIGHTS
Client retains sole and exclusive ownership of all Client Data. Subject to full payment of fees, Consultant hereby irrevocably assigns to Client all right, title, and interest in and to all Work Product, custom code, and inventions developed under this Agreement.

4. LIMITATION OF LIABILITY
EXCEPT FOR WILLFUL MISCONDUCT OR BREACH OF CONFIDENTIALITY, IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY EXCEED THE TOTAL FEES PAID OR PAYABLE UNDER THIS AGREEMENT IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

5. GOVERNING LAW & JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles.`;

export default function DocumentNlpScanner({ initialDoc }) {
  const [title, setTitle] = useState(initialDoc?.title || "Master Professional Services Agreement");
  const [rawText, setRawText] = useState(SAMPLE_TEXT);
  const [extractedDoc, setExtractedDoc] = useState(initialDoc || null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    const result = await parseContractText(title, rawText);
    setExtractedDoc(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-indigo-400" />
            NLP Clause Extraction & Legal Risk Scanner
          </h2>
          <p className="text-xs text-slate-400">
            Extract entities, detect missing legal provisions, and audit liability exposure in real-time.
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-indigo-950/50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Analyzing NLP Tokens...' : 'Execute NLP Clause Extraction'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Raw Text Input (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Agreement Document Source</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">OCR / Plain Text</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Contract Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Raw Contract Text</label>
            <textarea
              rows={16}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-none selection:bg-indigo-500 selection:text-white"
            />
          </div>
        </div>

        {/* Extracted NLP Intelligence (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {extractedDoc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Extracted Key-Value Entities</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Risk Rating: {extractedDoc.risk_score}/100
                </span>
              </div>

              {/* Extracted Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Primary Party (Client)</span>
                  <span className="text-white font-bold">{extractedDoc.party_a}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Counterparty (Vendor)</span>
                  <span className="text-white font-bold">{extractedDoc.party_b}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500 block text-[10px] uppercase">Governing Jurisdiction</span>
                  <span className="text-slate-300">{extractedDoc.governing_law}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500 block text-[10px] uppercase">Liability Risk Cap</span>
                  <span className="text-emerald-400 font-bold">{extractedDoc.liability_cap}</span>
                </div>
              </div>

              {/* Extracted Clauses Table */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Mandatory Legal Playbook Clauses
                </div>

                <div className="space-y-2">
                  {extractedDoc.extracted_clauses?.map((c, i) => (
                    <div 
                      key={i}
                      className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70 text-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          {c.status === 'PRESENT' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          {c.clause_type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Confidence: {(c.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 italic font-mono pl-5">
                        "{c.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Clauses Detector */}
              {extractedDoc.missing_clauses?.length > 0 && (
                <div className="p-3.5 bg-rose-950/20 rounded-lg border border-rose-500/30 text-xs">
                  <div className="text-[11px] font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Missing Clauses Flagged
                  </div>
                  <ul className="list-disc list-inside text-rose-200/90 text-[11px] space-y-0.5">
                    {extractedDoc.missing_clauses.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prescriptive Legal Advice */}
              <div className="p-3.5 bg-indigo-950/20 rounded-lg border border-indigo-500/30 text-xs">
                <div className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  Prescriptive Legal Counsel Assessment
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {extractedDoc.audit_summary}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <ScanLine className="w-10 h-10 mx-auto text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm">Click "Execute NLP Clause Extraction" to parse contract entities.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
