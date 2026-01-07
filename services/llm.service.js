import OpenAI from 'openai';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * LLM Document Understanding Service
 * Parses raw OCR text into structured data.
 * 
 * @param {string} rawText - Text extracted from OCR
 * @returns {Promise<Object>} - Structured JSON data
 */
export const parseDocumentData = async (rawText) => {
    try {
        const currentDate = dayjs().format('YYYY-MM-DD');

        const systemPrompt = `
      You are a LegalTech AI specialized in document verification. 
      Your task is to analyze raw OCR text from identity documents and extract structured, validated data.

      CONTEXT:
      - Today's Date: ${currentDate}
      - The text comes from OCR (can contain typos, noise).

      INSTRUCTIONS:
      1. CLASSIFY the document type. strict options: ["passport", "national_id", "driving_license", "other"].
         - If it has "Passport" or country code + passport number, it's a "passport".
         - If it says "Driving License", "Driver License", "DL", or has vehicle categories, it's a "driving_license".
         - If it has "Identity Card", "National ID", "Residence Permit", it's a "national_id".
      2. EXTRACT the Document Number.
         - Look for labels like "Doc No", "Passport No", "ID No", "Licence No", "DL No".
         - Clean the value: Remove spaces, special chars like '-' unless standard.
      3. EXTRACT the Expiry Date.
         - Output format MUST be YYYY-MM-DD.
         - Look for "Expiry", "Expires", "EXP", "Valid Until".
         - If ambiguious (e.g. 01/02/03), use ISO standard or best guess based on 2020s context.
      4. VALIDATE.
         - Check for "inconsistencies" (e.g., text mentions separate expiry dates).

      OUTPUT JSON FORMAT:
      {
        "document_type": "string", 
        "document_number": "string" | null,
        "expiry_date": "YYYY-MM-DD" | null,
        "inconsistencies": ["string"],
        "confidence_indication": "high" | "medium" | "low"
      }
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Raw OCR Text:\n${rawText}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = response.choices[0].message.content;
        const parsedData = JSON.parse(content);

        // Logging for debugging pipeline
        console.log(">> LLM Raw Decision:", JSON.stringify(parsedData, null, 2));

        return parsedData;

    } catch (error) {
        console.error("LLM Extraction Error:", error);
        return {
            document_type: "other",
            document_number: null,
            expiry_date: null,
            inconsistencies: ["LLM processing failed: " + error.message],
            confidence_indication: "low"
        };
    }
};
