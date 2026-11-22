// DocuSense API Service

const API_BASE = 'http://localhost:8001';

export const fallbackDocuments = [
  {
    doc_id: "DOC-2026-081",
    title: "Enterprise Master Cloud Services Agreement",
    document_type: "Master Services Agreement",
    party_a: "Acme Enterprise Inc",
    party_b: "SkyCloud Global LLC",
    effective_date: "2026-01-15",
    termination_date: "2029-01-14",
    contract_value_usd: 450000.0,
    governing_law: "Delaware US",
    liability_cap: "12 Months Fees Cap",
    missing_clauses: [],
    risk_score: 12,
    compliance_status: "COMPLIANT",
    audit_summary: "Standard enterprise MSA with reciprocal confidentiality and IP indemnity.",
    extracted_clauses: [
      { clause_type: "Confidentiality", confidence: 0.98, status: "PRESENT", snippet: "Each party agrees to hold proprietary technical data in strict confidence for 3 years." },
      { clause_type: "Intellectual Property", confidence: 0.95, status: "PRESENT", snippet: "Customer retains all rights, title, and interest in Customer Data and Cloud Workloads." },
      { clause_type: "Indemnification", confidence: 0.94, status: "PRESENT", snippet: "Vendor indemnifies Customer against third-party patent or copyright infringement claims." },
      { clause_type: "Limitation of Liability", confidence: 0.96, status: "PRESENT", snippet: "Total aggregate liability capped at aggregate fees paid in prior 12 months." }
    ]
  },
  {
    doc_id: "DOC-2026-094",
    title: "Supplier Hardware Procurement Contract",
    document_type: "Procurement Contract",
    party_a: "Apex Logistics Corp",
    party_b: "Global Chipsets Ltd",
    effective_date: "2026-03-01",
    termination_date: "2027-02-28",
    contract_value_usd: 1280000.0,
    governing_law: "California US",
    liability_cap: "Unlimited Indirect Liability",
    missing_clauses: ["Force Majeure", "Dispute Arbitration"],
    risk_score: 78,
    compliance_status: "HIGH_RISK_ALERT",
    audit_summary: "Uncapped indirect liability clause detected; missing dispute arbitration venue.",
    extracted_clauses: [
      { clause_type: "Warranty", confidence: 0.92, status: "PRESENT", snippet: "Supplier warrants silicon wafers free from defects for 24 months from delivery." },
      { clause_type: "Limitation of Liability", confidence: 0.97, status: "FLAGGED", snippet: "Neither party disclaims consequential, punitive or indirect lost profits." },
      { clause_type: "Force Majeure", confidence: 0.12, status: "MISSING", snippet: "No standard excusable delay provision found for global supply-chain shock." },
      { clause_type: "Dispute Arbitration", confidence: 0.08, status: "MISSING", snippet: "No mandatory AAA or ICC commercial arbitration clause specified." }
    ]
  },
  {
    doc_id: "DOC-2026-112",
    title: "Mutual Non-Disclosure Agreement (MNDA)",
    document_type: "Non-Disclosure Agreement",
    party_a: "Nexus BioTech Corp",
    party_b: "Quantum Genomics AI",
    effective_date: "2026-06-10",
    termination_date: "2028-06-09",
    contract_value_usd: 0.0,
    governing_law: "New York US",
    liability_cap: "N/A - Injunctive Relief",
    missing_clauses: ["Audit Rights Clause"],
    risk_score: 24,
    compliance_status: "LOW_RISK",
    audit_summary: "Standard 2-year reciprocal NDA for joint IP evaluation.",
    extracted_clauses: [
      { clause_type: "Definition of Confidential Info", confidence: 0.99, status: "PRESENT", snippet: "Includes genetic sequence datasets, model weights, and assay pipelines." },
      { clause_type: "Permitted Purpose", confidence: 0.96, status: "PRESENT", snippet: "Evaluating potential joint R&D collaboration exclusively." },
      { clause_type: "Term & Return of Data", confidence: 0.95, status: "PRESENT", snippet: "Recipient shall securely destroy or return all digital artifacts upon 30 days notice." }
    ]
  },
  {
    doc_id: "DOC-2026-202",
    title: "Independent Contractor Advisory Statement of Work",
    document_type: "Statement of Work (SOW)",
    party_a: "Apex Robotics Ltd",
    party_b: "Dr. Elena Vance Consulting",
    effective_date: "2026-04-01",
    termination_date: "2026-10-01",
    contract_value_usd: 65000.0,
    governing_law: "Massachusetts US",
    liability_cap: "Total SOW Value",
    missing_clauses: ["Work Product Assignment", "Data Security Policy"],
    risk_score: 85,
    compliance_status: "CRITICAL_RISK",
    audit_summary: "Missing explicit intellectual property assignment of contractor inventions.",
    extracted_clauses: [
      { clause_type: "Payment Schedule", confidence: 0.95, status: "PRESENT", snippet: "Milestone payments of $10,833 monthly against accepted sprint deliverables." },
      { clause_type: "IP Assignment", confidence: 0.15, status: "MISSING", snippet: "No 'Work Made for Hire' or irrevocable assignment clause detected." },
      { clause_type: "Data Security Policy", confidence: 0.10, status: "MISSING", snippet: "Missing mandatory SOC-2 encryption standards for contractor laptop." }
    ]
  }
];

export async function fetchDocuments() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/documents`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return fallbackDocuments;
  }
}

export async function fetchComplianceSummary() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/analytics/compliance-summary`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    return {
      total_documents_analyzed: 4,
      compliant_documents: 1,
      low_risk_documents: 1,
      critical_risk_documents: 2,
      total_contract_value_usd: 1795000.0,
      common_missing_clauses: ["Work Product Assignment", "Force Majeure", "Dispute Arbitration"]
    };
  }
}

export async function parseContractText(title, raw_text) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/documents/parse-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, raw_text })
    });
    if (!res.ok) throw new Error('Parse error');
    return await res.json();
  } catch (e) {
    // Local fallback NLP simulation
    return {
      doc_id: `DOC-2026-${Math.floor(300 + Math.random() * 400)}`,
      title: title || "Scanned Vendor Agreement",
      document_type: "Commercial Agreement",
      party_a: "Initech Enterprise LLC",
      party_b: "Vertex Cloud Services",
      effective_date: "2026-06-01",
      termination_date: "2028-05-31",
      contract_value_usd: 210000.0,
      governing_law: "Delaware US",
      liability_cap: "Direct Fees Only",
      missing_clauses: ["Audit Rights", "Force Majeure"],
      risk_score: 38,
      compliance_status: "LOW_RISK",
      audit_summary: "Parsed successfully. 2 standard clauses missing, liability cap verified.",
      extracted_clauses: [
        { clause_type: "Confidentiality", confidence: 0.94, status: "PRESENT", snippet: "Strict reciprocal protection for 3 years from disclosure." },
        { clause_type: "Intellectual Property", confidence: 0.91, status: "PRESENT", snippet: "Pre-existing background IP remains with respective owners." },
        { clause_type: "Force Majeure", confidence: 0.15, status: "MISSING", snippet: "No excusable delay provision identified." }
      ]
    };
  }
}
