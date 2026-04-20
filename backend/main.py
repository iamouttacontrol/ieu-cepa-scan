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


class DimensionInput(BaseModel):
    """Dimension-based assessment: list of 0/1/2 responses for each question."""
    d1: list[int] = Field(default_factory=lambda: [0, 0, 0, 0])  # Product Standards & Safety
    d2: list[int] = Field(default_factory=lambda: [0, 0, 0, 0])  # Sustainability & Due Diligence
    d3: list[int] = Field(default_factory=lambda: [0, 0, 0, 0])  # Supply Chain Transparency
    d4: list[int] = Field(default_factory=lambda: [0, 0, 0, 0])  # Data Protection & Digital Compliance
    d5: list[int] = Field(default_factory=lambda: [0, 0, 0, 0])  # Documentation & Certification
    d6: list[int] = Field(default_factory=lambda: [0, 0, 0, 0])  # Market Access Fundamentals


class ActionItem(BaseModel):
    text: str
    dimension: str   # 'D1'–'D6'
    effort: str      # 'low', 'medium', 'high'
    priority: str    # 'critical', 'significant', 'monitored'


class DimensionScore(BaseModel):
    id: str          # 'd1'–'d6'
    name: str
    score: int       # 0–100
    weight: float
    priority: str    # 'critical', 'significant', 'monitored', 'good'


class ReadinessScanRequest(BaseModel):
    company_name: str = Field(..., description="Name of the exporting company")
    sector: str = Field(..., description="Industry sector, e.g. 'Furniture', 'Textiles'")
    product_type: str = Field(..., description="Main product being exported")
    target_country: str = Field(default="", description="Target EU market country")
    export_experience: str = Field(default="", description="Export experience level")
    language: str = Field(default="de", description="Response language: 'de', 'en', or 'id'")
    # Dimension-based assessment (new)
    dimensions: DimensionInput = Field(default_factory=DimensionInput)
    # Legacy checkbox fields (kept for backwards compatibility)
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
    action_plan: list[str]  # kept for backwards compatibility
    action_items: list[ActionItem] = Field(default_factory=list)
    dimension_scores: list[DimensionScore] = Field(default_factory=list)
    analysis: str = Field(..., description="Detailed narrative analysis from the AI")


# ---------------------------------------------------------------------------
# Helper: build readiness prompt
# ---------------------------------------------------------------------------

def _calc_dimension_scores(data: ReadinessScanRequest) -> list[DimensionScore]:
    """Calculate per-dimension scores and classify gaps based on sector weights."""
    dim_map = {
        "d1": "Product Standards & Safety",
        "d2": "Sustainability & Due Diligence",
        "d3": "Supply Chain Transparency",
        "d4": "Data Protection & Digital Compliance",
        "d5": "Documentation & Certification",
        "d6": "Market Access Fundamentals",
    }

    # Sector-based weights
    s = data.sector.lower()
    if any(x in s for x in ["food", "lebensmittel", "agri", "beverage", "getränke", "pangan"]):
        weights = {"d1": 0.10, "d2": 0.25, "d3": 0.20, "d4": 0.10, "d5": 0.20, "d6": 0.15}
    elif any(x in s for x in ["textil", "apparel", "pakaian", "fashion"]):
        weights = {"d1": 0.20, "d2": 0.20, "d3": 0.20, "d4": 0.10, "d5": 0.15, "d6": 0.15}
    elif any(x in s for x in ["elektronik", "electronic", "tech"]):
        weights = {"d1": 0.30, "d2": 0.10, "d3": 0.05, "d4": 0.20, "d5": 0.20, "d6": 0.15}
    elif any(x in s for x in ["möbel", "wood", "furniture", "kayu", "holz"]):
        weights = {"d1": 0.20, "d2": 0.25, "d3": 0.20, "d4": 0.05, "d5": 0.15, "d6": 0.15}
    else:
        w = round(1 / 6, 4)
        weights = {k: w for k in dim_map}

    results = []
    dim_data = {
        "d1": data.dimensions.d1,
        "d2": data.dimensions.d2,
        "d3": data.dimensions.d3,
        "d4": data.dimensions.d4,
        "d5": data.dimensions.d5,
        "d6": data.dimensions.d6,
    }

    for dim_id, responses in dim_data.items():
        if not responses:
            responses = [0, 0, 0, 0]
        max_score = len(responses) * 2
        raw = sum(min(max(int(r), 0), 2) for r in responses)
        score = round((raw / max_score) * 100) if max_score > 0 else 0
        weight = weights.get(dim_id, 1 / 6)
        is_high_weight = weight >= 0.20
        if score < 40 and is_high_weight:
            priority = "critical"
        elif score < 60:
            priority = "significant"
        elif score < 80:
            priority = "monitored"
        else:
            priority = "good"
        results.append(DimensionScore(
            id=dim_id,
            name=dim_map[dim_id],
            score=score,
            weight=weight,
            priority=priority,
        ))
    return results


def _build_readiness_prompt(data: ReadinessScanRequest, dimension_scores: list[DimensionScore]) -> str:
    import json as _json

    lang_name = _LANGUAGE_NAMES.get(data.language, "German")

    # Overall weighted score
    overall = round(sum(d.score * d.weight for d in dimension_scores))

    dim_lines = "\n".join(
        f"  {d.id.upper()} – {d.name}: {d.score}/100 (weight {d.weight:.0%}, gap: {d.priority})"
        for d in dimension_scores
    )

    gaps = [d for d in dimension_scores if d.priority in ("critical", "significant")]
    gap_names = ", ".join(d.name for d in gaps) if gaps else "None"

    return f"""You are an EU compliance expert for Indonesian SME exporters (IEU-CEPA).
Analyse the following dimension-based readiness scan and return a structured assessment.
IMPORTANT: All text values in the JSON must be written in {lang_name}.

COMPANY: {data.company_name}
SECTOR: {data.sector}
PRODUCT: {data.product_type}
TARGET MARKET: {data.target_country or 'EU'}
EXPORT EXPERIENCE: {data.export_experience or 'Unknown'}

DIMENSION SCORES (0-100):
{dim_lines}

Overall weighted score: {overall}/100
Priority gaps: {gap_names}

TASK:
Return a JSON response in exactly this format (no markdown code block):
{{
  "score": {overall},
  "risk_level": "{'Low' if overall >= 70 else ('Medium' if overall >= 40 else 'High')}",
  "completed_requirements": [<list of dimensions/areas where score >= 60 in {lang_name}>],
  "missing_requirements": [<list of key missing items for gap dimensions in {lang_name}>],
  "action_plan": [<max 6 prioritised actions as plain strings in {lang_name}>],
  "action_items": [
    {{
      "text": "<concrete action step in {lang_name}>",
      "dimension": "<e.g. D1, D2, ...>",
      "effort": "<'low', 'medium', or 'high'>",
      "priority": "<'critical', 'significant', or 'monitored'>"
    }}
  ],
  "analysis": "<3-4 sentence analysis in {lang_name}: key strengths, critical gaps, urgency>"
}}

Rules for action_items:
- Generate 4-8 items, ordered by urgency (critical first)
- effort = 'high' means weeks/months; 'medium' = days/weeks; 'low' = hours/days
- Only include items for dimensions with score < 80
- Be concrete and practical for an Indonesian SME

Consider sector-specific risks for {data.sector} and IEU-CEPA trade requirements.
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
    Analyze a company's EU compliance readiness based on dimension-based assessment.
    Returns a score, risk level, dimension scores, gap classifications, and a prioritised action plan.
    """
    import json

    # Calculate dimension scores deterministically first
    dimension_scores = _calc_dimension_scores(request)
    overall_score = round(sum(d.score * d.weight for d in dimension_scores))

    prompt = _build_readiness_prompt(request, dimension_scores)

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
        risk = "Low" if overall_score >= 70 else ("Medium" if overall_score >= 40 else "High")
        return ReadinessResponse(
            score=overall_score,
            risk_level=risk,
            completed_requirements=[],
            missing_requirements=[],
            action_plan=["Analysis could not be processed – please try again."],
            action_items=[],
            dimension_scores=dimension_scores,
            analysis=raw_answer[:500],
        )

    # Parse structured action_items if present
    raw_items = parsed.get("action_items", [])
    action_items: list[ActionItem] = []
    for item in raw_items:
        if isinstance(item, dict) and "text" in item:
            action_items.append(ActionItem(
                text=str(item.get("text", "")),
                dimension=str(item.get("dimension", "")).upper(),
                effort=str(item.get("effort", "medium")).lower(),
                priority=str(item.get("priority", "significant")).lower(),
            ))

    return ReadinessResponse(
        score=int(parsed.get("score", overall_score)),
        risk_level=str(parsed.get("risk_level", "High")),
        completed_requirements=list(parsed.get("completed_requirements", [])),
        missing_requirements=list(parsed.get("missing_requirements", [])),
        action_plan=list(parsed.get("action_plan", [])),
        action_items=action_items,
        dimension_scores=dimension_scores,
        analysis=str(parsed.get("analysis", "")),
    )
