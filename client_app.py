import gradio as gr
import requests
import json

# Configuration
API_URL = "http://127.0.0.1:4000/api/upload"

def verify_document(file_obj, email, doc_type):
    if file_obj is None:
        return "⚠️ Error: Please upload a document.", None

    file_path = file_obj
    data = {'email': email}
    if doc_type and doc_type != "auto_detect":
        data['metadataType'] = doc_type

    try:
        with open(file_path, 'rb') as f:
            files = {'document': f}
            response = requests.post(API_URL, files=files, data=data)
        
        try:
            result = response.json()
        except json.JSONDecodeError:
            print(f"Server Response (Text): {response.text}") 
            return f"❌ Server returned invalid JSON. Raw response:\n{response.text[:500]}...", None

        if response.status_code == 200:
            if result.get("success"):
                extracted_data = result.get('data', {})
                confidence = extracted_data.get('confidence_score', 'N/A')
                status = extracted_data.get('status', 'Unknown')
                detected_type = extracted_data.get('document_type', 'Unknown')
                doc_number = extracted_data.get('extracted_data', {}).get('document_number', 'N/A')
                
                summary = (
                    f"✅ Status: {status}\n"
                    f"📄 Type: {detected_type.upper()}\n"
                    f"🔢 Conf. Score: {confidence}\n"
                    f"🆔 Doc Num: {doc_number}"
                )
                return summary, extracted_data
            else:
                return f"❌ API Error: {result.get('error')}", response.json()
        else:
            return f"❌ Server Error ({response.status_code}): {response.text}", None

    except requests.exceptions.ConnectionError:
        return "❌ Connection Failed: Ensure the Node.js server is running on port 4000.", None
    except Exception as e:
        return f"❌ Client Error: {str(e)}", None

# Build UI
with gr.Blocks(title="LegalTech Doc Verifier", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
        # ⚖️ LegalTech Document Verification System
        **Hybrid AI Verification**: Upload a Passport, National ID, or Driving License.
        """
    )
    
    with gr.Row():
        with gr.Column(scale=1):
            file_input = gr.File(
                label="📄 Upload Document (PDF/JPG/PNG)", 
                file_types=[".pdf", ".png", ".jpg", ".jpeg"]
            )
            
            with gr.Row():
                type_input = gr.Dropdown(
                    choices=["auto_detect", "passport", "national_id", "driving_license"], 
                    value="auto_detect", 
                    label="Document Type Hint"
                )
                email_input = gr.Textbox(label="📧 Notify Email (Optional)", placeholder="user@company.com")
            
            verify_btn = gr.Button("🔍 Verify Document", variant="primary", size="lg")
        
        with gr.Column(scale=1):
            output_summary = gr.Textbox(label="📊 Quick Summary", lines=4)
            output_json = gr.JSON(label="📝 Detailed Verification Data")

    verify_btn.click(
        fn=verify_document,
        inputs=[file_input, email_input, type_input],
        outputs=[output_summary, output_json]
    )

if __name__ == "__main__":
    print("Starting Gradio Web Client...")
    demo.launch(server_name="127.0.0.1", server_port=7860, show_error=True)
