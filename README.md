# LegalTech Document Verification System

A production-ready **Hybrid AI** verification system that combines **Computer Vision**, **LLMs**, and **Deterministic Rule Engines** to verify identity documents (Passports, National IDs, Driving Licenses).

## 🏗️ System Architecture

The following pipeline demonstrates how a document is processed from upload to final verification:

```mermaid
graph TD
    User([User / Gradio Client]) -->|Uploads File| API[Node.js API (Port 4000)]
    API -->|1. Receive File| OCR{OCR Service}
    
    OCR -->|If Image| Vision[OpenAI Vision API]
    OCR -->|If PDF| PDFParse[pdf-parse Library]
    
    Vision -->|Raw Text| LLM[LLM Service (GPT-4o-mini)]
    PDFParse -->|Raw Text| LLM
    
    LLM -->|2. Extract Structured Data| Data{Structured JSON}
    
    Data -->|3. Detect Type| TypeLogic[Type Detector]
    TypeLogic -->|Passport/ID/License| Router[Verification Router]
    
    Router -->|Passport| Rules1[Passport Rules]
    Router -->|National ID| Rules2[ID Rules]
    Router -->|Driving License| Rules3[License Rules]
    
    Rules1 & Rules2 & Rules3 -->|Pass/Fail Details| Score[Confidence Scorer]
    
    Score -->|Final JSON| API
    API -->|Response| User
```

## ✨ Features

-   **Hybrid AI Extraction**: Uses **OpenAI GPT-4o Vision** for images and `pdf-parse` for PDFs.
-   **Intelligent Classification**: Automatically distinguishes between Passports, IDs, and Driving Licenses using semantic cues.
-   **LegalTech Compliance**: Uses strictly hardcoded (deterministic) logic for verification, not "hallucinated" judgments.
-   **Confidence Scoring**: Aggregates OCR quality, AI certainty, and Rule checks into a single trust score.
-   **Dual Interface**: Complete **Node.js REST API** backend + **Python Gradio** frontend.

## 🚀 Getting Started

### Prerequisites

-   **Node.js** (v16+)
-   **Python** (3.8+)
-   **OpenAI API Key**

### 1. Backend Setup (Node.js)

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Configure Environment:
    -   Update `.env` with your API Key.
    -   (Optional) Add Gmail credentials if you want email notifications.
3.  Start the Server:
    ```bash
    npm start
    ```
    *Server runs on port 4000*

### 2. Frontend Setup (Python)

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Start the Client:
    ```bash
    python client_app.py
    ```
3.  Open `http://127.0.0.1:7860` in your browser.

## 📂 Project Structure

```text
/
├── server.js                  # API Entry Point (Express)
├── client_app.py              # Frontend UI (Gradio)
├── services/
│   ├── ocr.service.js         # Vision/PDF Extraction
│   ├── llm.service.js         # GPT-4o logic
│   ├── detectDocumentType.js  # Classification System
│   └── verification/          # Rule Engines
│         ├── passport.js
│         ├── id.js
│         └── driving_license.js
└── routes/
    └── upload.routes.js       # API Orchestration
```

## 🛡️ Verification Logic

-   **Passport**: Checks 9-char alphanumeric format + 6-month validity.
-   **National ID**: Checks 8-digit format + expiry status.
-   **Driving License**: Checks min-length (5) + strict expiry.
