"""
Ingest PDF documents into ChromaDB for RAG retrieval.

Usage:
    python -m rag.ingest

Place PDF files in backend/documents/ before running.
"""

import os
import sys
from pathlib import Path

_backend_dir = Path(__file__).parent.parent

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

DOCUMENTS_DIR = _backend_dir / "documents"
CHROMA_DIR = _backend_dir / "chroma_db"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
EMBEDDING_MODEL = "text-embedding-3-small"


def ingest_documents() -> None:
    """Load all PDFs from documents/, chunk them, embed, and persist to ChromaDB."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)

    pdf_files = list(DOCUMENTS_DIR.rglob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {DOCUMENTS_DIR}. Add PDFs and re-run.")
        sys.exit(1)

    print(f"Found {len(pdf_files)} PDF file(s) in {DOCUMENTS_DIR}\n")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    all_documents = []

    for pdf_path in pdf_files:
        print(f"  Loading: {pdf_path.name} ...", end=" ", flush=True)
        try:
            loader = PyPDFLoader(str(pdf_path))
            pages = loader.load()

            # Attach relative path (preserves folder structure) to metadata
            rel_path = pdf_path.relative_to(DOCUMENTS_DIR)
            for page in pages:
                page.metadata["source"] = str(rel_path)

            chunks = text_splitter.split_documents(pages)
            all_documents.extend(chunks)
            print(f"OK  ({len(pages)} pages -> {len(chunks)} chunks)")
        except Exception as exc:
            print(f"FAILED\n    Error processing {pdf_path.name}: {exc}")

    if not all_documents:
        print("\nNo documents were successfully loaded. Aborting.")
        sys.exit(1)

    print(f"\nTotal chunks to embed: {len(all_documents)}")
    print("Creating embeddings and storing in ChromaDB (this may take a moment) ...")

    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        openai_api_key=api_key,
    )

    # Persist to disk — Chroma will create the directory if needed
    vectorstore = Chroma.from_documents(
        documents=all_documents,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
        collection_name="eu_compliance_docs",
    )

    print(f"\nDone. ChromaDB persisted to: {CHROMA_DIR}")
    print(f"Collection contains {vectorstore._collection.count()} vectors.")


if __name__ == "__main__":
    ingest_documents()
