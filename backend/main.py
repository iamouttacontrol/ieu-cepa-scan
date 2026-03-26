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
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag.retriever import get_rag_response

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


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


class ReadinessScanRequest(BaseModel):
    company_name: str = Field(..., description="Name of the exporting company")
    sector: str = Field(..., description="Industry sector, e.g. 'Furniture', 'Textiles'")
    product_type: str = Field(..., description="Main product being exported")
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
    checklist = {
        "Digital Product Passport (DPP) vorhanden": data.compliance_dpp,
        "EUDR Sorgfaltspflicht erfüllt": data.compliance_eudr,
        "CE-Kennzeichnung vorhanden": data.compliance_ce,
        "ESG-Berichterstattung (CSRD) vorhanden": data.compliance_esg,
        "Ursprungszeugnis vorhanden": data.compliance_origin,
        "Lebensmittelsicherheit (HACCP/EU 178/2002) erfüllt": data.compliance_food_safety,
    }

    completed = [k for k, v in checklist.items() if v]
    missing = [k for k, v in checklist.items() if not v]
    raw_score = int(len(completed) / len(checklist) * 100)

    checklist_text = "\n".join(
        f"  {'[x]' if v else '[ ]'} {k}" for k, v in checklist.items()
    )

    return f"""Du bist ein EU-Compliance-Experte für indonesische KMU-Exporteure (IEU-CEPA).
Analysiere den folgenden Compliance-Scan eines Unternehmens und erstelle eine strukturierte Bewertung.

UNTERNEHMEN: {data.company_name}
SEKTOR: {data.sector}
PRODUKT: {data.product_type}

COMPLIANCE-CHECKLISTE:
{checklist_text}

Erfüllt: {len(completed)}/{len(checklist)} Anforderungen
Vorläufiger Rohwert: {raw_score}/100

AUFGABE:
Erstelle eine JSON-Antwort mit genau diesem Format (ohne Markdown-Codeblock):
{{
  "score": <integer 0-100, gewichtet nach Wichtigkeit der Anforderungen>,
  "risk_level": "<'Low' wenn Score >= 70, 'Medium' wenn 40-69, 'High' wenn < 40>",
  "completed_requirements": {_json.dumps(completed)},
  "missing_requirements": [<Liste der fehlenden Anforderungen als kurze deutsche Strings>],
  "action_plan": [<priorisierte Handlungsempfehlungen auf Deutsch, max. 6 konkrete Schritte>],
  "analysis": "<Detaillierte Analyse auf Deutsch in 3-4 Sätzen: Stärken, Risiken, Dringlichkeit>"
}}

Berücksichtige dabei:
- Sektorspezifische Risiken für {data.sector} (z.B. EUDR bei Holz/Palmöl, CE bei Elektronik)
- IEU-CEPA Anforderungen und EU-Marktzugangsvoraussetzungen
- Priorisierung nach Umsetzungsdringlichkeit und Bußgeldrisiko
- Praktische Umsetzbarkeit für kleine indonesische Unternehmen
"""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", summary="Health check")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse, summary="RAG-powered compliance Q&A")
def chat(request: ChatRequest) -> ChatResponse:
    """Answer a compliance question using the indexed EU regulation documents."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message must not be empty.")

    try:
        result = get_rag_response(
            question=request.message,
            chat_history=request.history,
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
