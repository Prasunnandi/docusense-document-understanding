import React from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  DollarSign, 
  Scale, 
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function DocumentAuditRepository({ documents, onSelectDocForScan }) {
  const getRiskBadge = (status, score) => {
    if (status === 'COMPLIANT' || score < 25) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
          LOW RISK ({score})
        </span>
      );
    } else if (status === 'LOW_RISK' || score < 50) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Clock className="w-3 h-3 mr-1 text-blue-400" />
          MODERATE ({score})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" />
          HIGH RISK ({score})
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Enterprise Contract & Agreement Repository
          </h2>
          <p className="text-xs text-slate-400">
            Automated OCR clause verification, liability cap auditing, and missing provision alerts.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
          Trained on Kaggle Commercial Legal NLP Benchmark
        </div>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((doc) => {
          const isHighRisk = doc.risk_score >= 60;

          return (
            <div 
              key={doc.doc_id}
              className={`bg-slate-900 rounded-xl border p-5 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700 ${
                isHighRisk 
                  ? 'border-rose-500/40 bg-gradient-to-b from-slate-900 to-rose-950/10' 
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {doc.doc_id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      {doc.document_type}
                    </span>
                  </div>
                  {getRiskBadge(doc.compliance_status, doc.risk_score)}
                </div>

                <h3 className="text-base font-bold text-white mt-1.5">{doc.title}</h3>
                <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <span className="text-slate-300 font-medium">{doc.party_a}</span>
                  <span className="text-slate-500">↔</span>
                  <span className="text-slate-300 font-medium">{doc.party_b}</span>
                </div>

                {/* Key Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Contract Value</span>
                    <span className="text-white font-bold">
                      ${doc.contract_value_usd > 0 ? doc.contract_value_usd.toLocaleString() : 'Reciprocal / Non-Monetary'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Governing Law</span>
                    <span className="text-slate-300 font-medium">{doc.governing_law}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block text-[10px] uppercase">Effective Window</span>
                    <span className="text-slate-300 text-[11px]">{doc.effective_date} to {doc.termination_date}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block text-[10px] uppercase">Liability Cap</span>
                    <span className={isHighRisk ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {doc.liability_cap}
                    </span>
                  </div>
                </div>

                {/* Missing Clauses Warning */}
                {doc.missing_clauses && doc.missing_clauses.length > 0 && (
                  <div className="mt-3 p-2.5 bg-rose-950/20 rounded border border-rose-500/30 text-xs">
                    <div className="text-[10px] font-mono text-rose-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      Missing Required Clauses ({doc.missing_clauses.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.missing_clauses.map((clause) => (
                        <span key={clause} className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40">
                          {clause}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Summary */}
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  <span className="font-semibold text-white">Audit Finding: </span>
                  {doc.audit_summary}
                </p>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => onSelectDocForScan(doc)}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Inspect Extracted Clauses in NLP Scanner</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
