"""
RAG retrieval and response generation.

Provides get_rag_response() used by the FastAPI endpoints.
"""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_backend_dir = Path(__file__).parent.parent
load_dotenv(_backend_dir / ".env")

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

CHROMA_DIR = _backend_dir / "chroma_db"
EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"
TOP_K = 5

SYSTEM_PROMPT = (
    "Du bist ein EU-Compliance-Experte für indonesische KMU-Exporteure im Rahmen des "
    "IEU-CEPA (Indonesia-EU Comprehensive Economic Partnership Agreement). "
    "Deine Aufgabe ist es, indonesischen Kleinunternehmen dabei zu helfen, die EU-Anforderungen "
    "zu verstehen und zu erfüllen, insbesondere in Bereichen wie EUDR (EU Deforestation Regulation), "
    "CE-Kennzeichnung, Digital Product Passport (DPP), ESG-Berichterstattung, CBAM und weiteren "
    "EU-Regulierungen. "
    "Beantworte Fragen präzise und praxisorientiert, basierend auf den bereitgestellten "
    "EU-Rechtsgrundlagen aus den Quelldokumenten. "
    "Wenn du eine Frage nicht anhand der Quellen beantworten kannst, weise klar darauf hin. "
    "Antworte in der Sprache, in der die Frage gestellt wurde (Deutsch, Englisch oder Indonesisch)."
)


def _load_vectorstore() -> Chroma:
    """Load the persisted ChromaDB vectorstore. Raises RuntimeError if not found."""
    if not CHROMA_DIR.exists():
        raise RuntimeError(
            f"ChromaDB not found at {CHROMA_DIR}. "
            "Please run 'python -m rag.ingest' first to index your documents."
        )

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set. Check your .env file.")

    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        openai_api_key=api_key,
    )

    return Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings,
        collection_name="eu_compliance_docs",
    )


def get_rag_response(question: str, chat_history: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Retrieve relevant document chunks and generate an answer using GPT-4o-mini.

    Args:
        question:     The user's question string.
        chat_history: List of previous turns, each {"role": "user"|"assistant", "content": str}.

    Returns:
        {"answer": str, "sources": list[str]}  where sources are PDF filenames (deduplicated).
    """
    vectorstore = _load_vectorstore()

    # Retrieve top-K relevant chunks
    retriever = vectorstore.as_retriever(search_kwargs={"k": TOP_K})
    relevant_docs = retriever.invoke(question)

    # Build context block from retrieved chunks
    context_parts: list[str] = []
    sources: list[str] = []
    for doc in relevant_docs:
        source = doc.metadata.get("source", "unknown")
        if source not in sources:
            sources.append(source)
        context_parts.append(f"[Quelle: {source}]\n{doc.page_content}")

    context_text = "\n\n---\n\n".join(context_parts)

    # Assemble message list for the LLM
    messages: list[Any] = [SystemMessage(content=SYSTEM_PROMPT)]

    # Inject prior chat turns
    for turn in chat_history:
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    # Final user message with retrieved context
    user_message_with_context = (
        f"Benutze die folgenden Informationen aus den EU-Regulierungsdokumenten, "
        f"um die Frage zu beantworten.\n\n"
        f"KONTEXT:\n{context_text}\n\n"
        f"FRAGE: {question}"
    )
    messages.append(HumanMessage(content=user_message_with_context))

    api_key = os.getenv("OPENAI_API_KEY")
    llm = ChatOpenAI(
        model=CHAT_MODEL,
        temperature=0.2,
        openai_api_key=api_key,
    )

    response = llm.invoke(messages)
    answer = response.content

    return {"answer": answer, "sources": sources}
