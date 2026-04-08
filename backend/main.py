"""
IEU-CEPA Compliance Scanner — FastAPI Backend

Endpoints:
  POST /chat               - RAG-powered Q&A chat
  POST /analyze-readiness  - Compliance readiness score and action plan
  GET  /health             - Health check
"""

import os
from pathlib import Path
from typing import Any


from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag.retriever import get_rag_response, _LANGUAGE_NAMES

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="IEU-CEPA Compliance Scanner API",
    description="RAG-powered EU compliance assistant for Indonesian SME exporters.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # prototype — restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's question or message")
    history: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Previous chat turns: [{'role': 'user'|'assistant', 'content': str}]",
    )
    language: str = Field(default="de", description="Response language: 'de', 'en', or 'id'")
    user_context: dict[str, Any] = Field(
        default_factory=dict,
        description="Optional user profile context: company, sector, last_score, missing_requirements",
    )


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


class ReadinessScanRequest(BaseModel):
    company_name: str = Field(..., description="Name of the exporting company")
    sector: str = Field(..., description="Industry sector, e.g. 'Furniture', 'Textiles'")
    product_type: str = Field(..., description="Main product being exported")
    language: str = Field(default="de", description="Response language: 'de', 'en', or 'id'")
    # Fields from mobile app (simple per-regulation checkboxes)
    compliance_dpp: bool = Field(False)
    compliance_eudr: bool = Field(False)
    compliance_ce: bool = Field(False)
    compliance_esg: bool = Field(False)
    compliance_origin: bool = Field(False)
    compliance_food_safety: bool = Field(False)


class ReadinessResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall readiness score 0-100")
    risk_level: str = Field(..., description="'Low', 'Medium', or 'High'")
    missing_requirements: list[str]
    completed_requirements: list[str]
    action_plan: list[str]
    analysis: str = Field(..., description="Detailed narrative analysis from the AI")


# ---------------------------------------------------------------------------
# Helper: build readiness prompt
# ---------------------------------------------------------------------------

def _build_readiness_prompt(data: ReadinessScanRequest) -> str:
    import json as _json

    lang_name = _LANGUAGE_NAMES.get(data.language, "German")

    checklist = {
        "Digital Product Passport (DPP)": data.compliance_dpp,
        "EUDR Due Diligence": data.compliance_eudr,
        "CE Marking": data.compliance_ce,
        "ESG Reporting (CSRD)": data.compliance_esg,
        "Certificate of Origin": data.compliance_origin,
        "Food Safety (HACCP/EU 178/2002)": data.compliance_food_safety,
    }

    completed = [k for k, v in checklist.items() if v]
    raw_score = int(len(completed) / len(checklist) * 100)

    checklist_text = "\n".join(
        f"  {'[x]' if v else '[ ]'} {k}" for k, v in checklist.items()
    )

    return f"""You are an EU compliance expert for Indonesian SME exporters (IEU-CEPA).
Analyse the following compliance scan and return a structured assessment.
IMPORTANT: All text values in the JSON (missing_requirements, action_plan, analysis) must be written in {lang_name}.

COMPANY: {data.company_name}
SECTOR: {data.sector}
PRODUCT: {data.product_type}

COMPLIANCE CHECKLIST:
{checklist_text}

Fulfilled: {len(completed)}/{len(checklist)} requirements
Preliminary raw score: {raw_score}/100

TASK:
Return a JSON response in exactly this format (no markdown code block):
{{
  "score": <integer 0-100, weighted by importance of requirements>,
  "risk_level": "<'Low' if score >= 70, 'Medium' if 40-69, 'High' if < 40>",
  "completed_requirements": {_json.dumps(completed)},
  "missing_requirements": [<list of missing requirements as short strings in {lang_name}>],
  "action_plan": [<prioritised action recommendations in {lang_name}, max. 6 concrete steps>],
  "analysis": "<Detailed analysis in {lang_name} in 3-4 sentences: strengths, risks, urgency>"
}}

Consider:
- Sector-specific risks for {data.sector} (e.g. EUDR for wood/palm oil, CE for electronics)
- IEU-CEPA requirements and EU market access conditions
- Prioritisation by implementation urgency and penalty risk
- Practical feasibility for small Indonesian companies
"""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", summary="Health check")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/documents/{filename:path}", summary="Serve a document file")
def serve_document(filename: str) -> FileResponse:
    """Stream a PDF file from the documents directory."""
    docs_dir = Path(__file__).parent / "documents"
    file_path = (docs_dir / filename).resolve()

    # Security: ensure the resolved path stays inside documents/
    if not str(file_path).startswith(str(docs_dir.resolve())):
        raise HTTPException(status_code=403, detail="Access denied.")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Document not found.")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=file_path.name,
    )


@app.get("/documents", summary="List all indexed documents")
def list_documents() -> list[dict]:
    """Return all PDF files available in the documents/ directory."""
    docs_dir = Path(__file__).parent / "documents"
    if not docs_dir.exists():
        return []

    documents = []
    for pdf_path in sorted(docs_dir.rglob("*.pdf")):
        rel_path = pdf_path.relative_to(docs_dir)
        stat = pdf_path.stat()
        import urllib.parse
        decoded = urllib.parse.unquote(pdf_path.stem)
        display_name = decoded.replace("_", " ").strip()
        documents.append({
            "filename": str(rel_path).replace("\\", "/"),
            "name": display_name,
            "size_kb": max(1, round(stat.st_size / 1024)),
        })
    return documents


@app.post("/chat", response_model=ChatResponse, summary="RAG-powered compliance Q&A")
def chat(request: ChatRequest) -> ChatResponse:
    """Answer a compliance question using the indexed EU regulation documents."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message must not be empty.")

    try:
        result = get_rag_response(
            question=request.message,
            chat_history=request.history,
            language=request.language,
            user_context=request.user_context,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")

    return ChatResponse(answer=result["answer"], sources=result["sources"])


@app.post("/analyze-readiness", response_model=ReadinessResponse, summary="Compliance readiness scan")
def analyze_readiness(request: ReadinessScanRequest) -> ReadinessResponse:
    """
    Analyze a company's EU compliance readiness based on a checklist scan.
    Returns a score, risk level, missing requirements, and a prioritized action plan.
    """
    import json

    prompt = _build_readiness_prompt(request)

    # Use RAG so the analysis is grounded in the indexed regulation documents
    try:
        rag_result = get_rag_response(
            question=prompt,
            chat_history=[],
            language=request.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")

    raw_answer = rag_result["answer"].strip()

    # Strip optional markdown code fences if the model wrapped the JSON
    if raw_answer.startswith("```"):
        lines = raw_answer.splitlines()
        raw_answer = "\n".join(
            line for line in lines if not line.startswith("```")
        ).strip()

    try:
        parsed: dict[str, Any] = json.loads(raw_answer)
    except json.JSONDecodeError:
        # Graceful fallback: return what we can parse structurally
        checklist_fields = [
            "compliance_dpp", "compliance_eudr", "compliance_ce",
            "compliance_esg", "compliance_origin", "compliance_food_safety",
        ]
        completed = sum(1 for f in checklist_fields if getattr(request, f))
        score = int(completed / len(checklist_fields) * 100)
        risk = "Low" if score >= 70 else ("Medium" if score >= 40 else "High")
        return ReadinessResponse(
            score=score,
            risk_level=risk,
            completed_requirements=[],
            missing_requirements=[],
            action_plan=["KI-Antwort konnte nicht verarbeitet werden – bitte erneut versuchen."],
            analysis=raw_answer[:500],
        )

    return ReadinessResponse(
        score=int(parsed.get("score", 0)),
        risk_level=str(parsed.get("risk_level", "High")),
        completed_requirements=list(parsed.get("completed_requirements", [])),
        missing_requirements=list(parsed.get("missing_requirements", [])),
        action_plan=list(parsed.get("action_plan", [])),
        analysis=str(parsed.get("analysis", "")),
    )
