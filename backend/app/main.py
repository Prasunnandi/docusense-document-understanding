import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="DocuSense — Intelligent Document Understanding & Contract Intelligence Engine",
    description="NLP-based OCR, Key-Value Extraction, Clause Risk Auditing, and Inconsistency Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed documents loaded from benchmark
DOCUMENTS_STORE = [
    {
        "doc_id": "DOC-2026-081",
        "title": "Enterprise Master Cloud Services Agreement",
        "document_type": "Master Services Agreement",
        "party_a": "Acme Enterprise Inc",
        "party_b": "SkyCloud Global LLC",
        "effective_date": "2026-01-15",
        "termination_date": "2029-01-14",
        "contract_value_usd": 450000.0,
        "governing_law": "Delaware US",
        "liability_cap": "12 Months Fees Cap",
        "missing_clauses": [],
        "risk_score": 12,
        "compliance_status": "COMPLIANT",
        "audit_summary": "Standard enterprise MSA with reciprocal confidentiality and IP indemnity.",
        "extracted_clauses": [
            {"clause_type": "Confidentiality", "confidence": 0.98, "status": "PRESENT", "snippet": "Each party agrees to hold proprietary technical data in strict confidence for 3 years."},
            {"clause_type": "Intellectual Property", "confidence": 0.95, "status": "PRESENT", "snippet": "Customer retains all rights, title, and interest in Customer Data and Cloud Workloads."},
            {"clause_type": "Indemnification", "confidence": 0.94, "status": "PRESENT", "snippet": "Vendor indemnifies Customer against third-party patent or copyright infringement claims."},
            {"clause_type": "Limitation of Liability", "confidence": 0.96, "status": "PRESENT", "snippet": "Total aggregate liability capped at aggregate fees paid in prior 12 months."}
        ]
    },
    {
        "doc_id": "DOC-2026-094",
        "title": "Supplier Hardware Procurement Contract",
        "document_type": "Procurement Contract",
        "party_a": "Apex Logistics Corp",
        "party_b": "Global Chipsets Ltd",
        "effective_date": "2026-03-01",
        "termination_date": "2027-02-28",
        "contract_value_usd": 1280000.0,
        "governing_law": "California US",
        "liability_cap": "Unlimited Indirect Liability",
        "missing_clauses": ["Force Majeure", "Dispute Arbitration"],
        "risk_score": 78,
        "compliance_status": "HIGH_RISK_ALERT",
        "audit_summary": "Uncapped indirect liability clause detected; missing dispute arbitration venue.",
        "extracted_clauses": [
            {"clause_type": "Warranty", "confidence": 0.92, "status": "PRESENT", "snippet": "Supplier warrants silicon wafers free from defects for 24 months from delivery."},
            {"clause_type": "Limitation of Liability", "confidence": 0.97, "status": "FLAGGED", "snippet": "Neither party disclaims consequential, punitive or indirect lost profits."},
            {"clause_type": "Force Majeure", "confidence": 0.12, "status": "MISSING", "snippet": "No standard excusable delay provision found for global supply-chain shock."},
            {"clause_type": "Dispute Arbitration", "confidence": 0.08, "status": "MISSING", "snippet": "No mandatory AAA or ICC commercial arbitration clause specified."}
        ]
    },
    {
        "doc_id": "DOC-2026-112",
        "title": "Mutual Non-Disclosure Agreement (MNDA)",
        "document_type": "Non-Disclosure Agreement",
        "party_a": "Nexus BioTech Corp",
        "party_b": "Quantum Genomics AI",
        "effective_date": "2026-06-10",
        "termination_date": "2028-06-09",
        "contract_value_usd": 0.0,
        "governing_law": "New York US",
        "liability_cap": "N/A - Injunctive Relief",
        "missing_clauses": ["Audit Rights Clause"],
        "risk_score": 24,
        "compliance_status": "LOW_RISK",
        "audit_summary": "Standard 2-year reciprocal NDA for joint IP evaluation.",
        "extracted_clauses": [
            {"clause_type": "Definition of Confidential Info", "confidence": 0.99, "status": "PRESENT", "snippet": "Includes genetic sequence datasets, model weights, and assay pipelines."},
            {"clause_type": "Permitted Purpose", "confidence": 0.96, "status": "PRESENT", "snippet": "Evaluating potential joint R&D collaboration exclusively."},
            {"clause_type": "Term & Return of Data", "confidence": 0.95, "status": "PRESENT", "snippet": "Recipient shall securely destroy or return all digital artifacts upon 30 days notice."}
        ]
    },
    {
        "doc_id": "DOC-2026-202",
        "title": "Independent Contractor Advisory Statement of Work",
        "document_type": "Statement of Work (SOW)",
        "party_a": "Apex Robotics Ltd",
        "party_b": "Dr. Elena Vance Consulting",
        "effective_date": "2026-04-01",
        "termination_date": "2026-10-01",
        "contract_value_usd": 65000.0,
        "governing_law": "Massachusetts US",
        "liability_cap": "Total SOW Value",
        "missing_clauses": ["Work Product Assignment", "Data Security Policy"],
        "risk_score": 85,
        "compliance_status": "CRITICAL_RISK",
        "audit_summary": "Missing explicit intellectual property assignment of contractor inventions.",
        "extracted_clauses": [
            {"clause_type": "Payment Schedule", "confidence": 0.95, "status": "PRESENT", "snippet": "Milestone payments of $10,833 monthly against accepted sprint deliverables."},
            {"clause_type": "IP Assignment", "confidence": 0.15, "status": "MISSING", "snippet": "No 'Work Made for Hire' or irrevocable assignment clause detected."},
            {"clause_type": "Data Security Policy", "confidence": 0.10, "status": "MISSING", "snippet": "Missing mandatory SOC-2 encryption standards for contractor laptop."}
        ]
    }
]

class TextParseRequest(BaseModel):
    title: Optional[str] = "Untitled Agreement Document"
    raw_text: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DocuSense Document Understanding & Contract OCR Engine",
        "version": "1.0.0"
    }

@app.get("/api/v1/analytics/compliance-summary")
def get_compliance_summary():
    total = len(DOCUMENTS_STORE)
    compliant = sum(1 for d in DOCUMENTS_STORE if d["compliance_status"] == "COMPLIANT")
    low_risk = sum(1 for d in DOCUMENTS_STORE if d["compliance_status"] == "LOW_RISK")
    critical = sum(1 for d in DOCUMENTS_STORE if d["compliance_status"] in ["HIGH_RISK_ALERT", "CRITICAL_RISK"])
    total_value = sum(d["contract_value_usd"] for d in DOCUMENTS_STORE)

    return {
        "total_documents_analyzed": total,
        "compliant_documents": compliant,
        "low_risk_documents": low_risk,
        "critical_risk_documents": critical,
        "total_contract_value_usd": total_value,
        "common_missing_clauses": ["Work Product Assignment", "Force Majeure", "Dispute Arbitration"]
    }

@app.get("/api/v1/documents")
def list_documents():
    return DOCUMENTS_STORE

@app.get("/api/v1/documents/{doc_id}")
def get_document(doc_id: str):
    doc = next((d for d in DOCUMENTS_STORE if d["doc_id"].upper() == doc_id.upper()), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@app.post("/api/v1/documents/parse-text")
def parse_raw_text(req: TextParseRequest):
    text = req.raw_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Simple heuristic Regex NLP entity extraction
    has_confidentiality = bool(re.search(r"confidential|proprietary|non-disclosure", text, re.I))
    has_ip = bool(re.search(r"intellectual property|assignment|work made for hire|patent|ownership", text, re.I))
    has_liability = bool(re.search(r"limitation of liability|indirect damages|aggregate liability", text, re.I))
    has_force_majeure = bool(re.search(r"force majeure|act of god|natural disaster", text, re.I))
    has_arbitration = bool(re.search(r"arbitration|dispute resolution|governing law|jurisdiction", text, re.I))

    # Calculate risk score
    missing = []
    if not has_ip:
        missing.append("Work Product IP Assignment")
    if not has_confidentiality:
        missing.append("Confidentiality Agreement")
    if not has_liability:
        missing.append("Limitation of Liability Cap")
    if not has_force_majeure:
        missing.append("Force Majeure Excusable Delay")
    if not has_arbitration:
        missing.append("Dispute Arbitration Clause")

    risk_score = min(95, max(10, len(missing) * 20))
    status = "COMPLIANT" if risk_score < 25 else "MEDIUM_RISK" if risk_score < 60 else "CRITICAL_RISK"

    # Parties heuristic
    parties_match = re.findall(r"between\s+([A-Za-z0-9\s,\.]+?)\s+and\s+([A-Za-z0-9\s,\.]+?)[\.,\n]", text, re.I)
    party_a = parties_match[0][0].strip() if parties_match else "Company Party A"
    party_b = parties_match[0][1].strip() if parties_match else "Counterparty B"

    new_doc = {
        "doc_id": f"DOC-2026-{100 + len(DOCUMENTS_STORE)}",
        "title": req.title or "Uploaded Contract Document",
        "document_type": "Contract Agreement",
        "party_a": party_a,
        "party_b": party_b,
        "effective_date": "2026-05-01",
        "termination_date": "2028-04-30",
        "contract_value_usd": 150000.0,
        "governing_law": "Delaware US",
        "liability_cap": "Fees Paid in 12 Months" if has_liability else "Uncapped Risk",
        "missing_clauses": missing,
        "risk_score": risk_score,
        "compliance_status": status,
        "audit_summary": f"Automated NLP scan detected {len(missing)} missing core clauses. Risk rating: {risk_score}/100.",
        "extracted_clauses": [
            {"clause_type": "Confidentiality", "confidence": 0.95 if has_confidentiality else 0.1, "status": "PRESENT" if has_confidentiality else "MISSING", "snippet": "Found confidentiality provisions" if has_confidentiality else "No confidentiality safeguards found"},
            {"clause_type": "Intellectual Property", "confidence": 0.94 if has_ip else 0.1, "status": "PRESENT" if has_ip else "MISSING", "snippet": "IP assignment provisions verified" if has_ip else "Missing intellectual property assignment"},
            {"clause_type": "Limitation of Liability", "confidence": 0.92 if has_liability else 0.1, "status": "PRESENT" if has_liability else "MISSING", "snippet": "Liability cap identified" if has_liability else "Potential uncapped liability hazard"}
        ]
    }

    DOCUMENTS_STORE.append(new_doc)
    return new_doc

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
