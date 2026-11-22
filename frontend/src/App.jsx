import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DocumentAuditRepository from './pages/DocumentAuditRepository';
import DocumentNlpScanner from './pages/DocumentNlpScanner';
import ContractComparisonView from './pages/ContractComparisonView';
import { fetchDocuments, fetchComplianceSummary, fallbackDocuments } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('repository');
  const [documents, setDocuments] = useState(fallbackDocuments);
  const [summary, setSummary] = useState({
    total_documents_analyzed: 4,
    compliant_documents: 1,
    low_risk_documents: 1,
    critical_risk_documents: 2,
    total_contract_value_usd: 1795000.0,
    common_missing_clauses: ["Work Product Assignment", "Force Majeure", "Dispute Arbitration"]
  });
  const [selectedDocForScan, setSelectedDocForScan] = useState(fallbackDocuments[0]);

  useEffect(() => {
    async function load() {
      const docs = await fetchDocuments();
      if (docs && docs.length) setDocuments(docs);
      const s = await fetchComplianceSummary();
      if (s) setSummary(s);
    }
    load();
  }, []);

  const handleSelectDocForScan = (doc) => {
    setSelectedDocForScan(doc);
    setActiveTab('scanner');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar summary={summary} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'repository' && (
              <DocumentAuditRepository 
                documents={documents} 
                onSelectDocForScan={handleSelectDocForScan} 
              />
            )}
            {activeTab === 'scanner' && (
              <DocumentNlpScanner 
                initialDoc={selectedDocForScan} 
              />
            )}
            {activeTab === 'compare' && (
              <ContractComparisonView 
                documents={documents} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
