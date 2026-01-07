import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createRequire } from 'module';

// FIX: Use createRequire to robustly import CommonJS modules like pdf-parse in ESM
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Vision/OCR Service
 * - For Images: Uses OpenAI GPT-4o Vision.
 * - For PDFs: Uses pdf-parse to extract raw text (Rule-based Fallback for PDF).
 * 
 * @param {string} filePath - Path to the uploaded file
 * @returns {Promise<Object>} - rawText and simulated confidence
 */
export const extractTextFromImage = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();

        // --- PDF HANDLING ---
        if (ext === '.pdf') {
            console.log("   Detected PDF. extracting text via pdf-parse...");
            const dataBuffer = fs.readFileSync(filePath);

            const pdfData = await pdfParse(dataBuffer);
            const text = pdfData.text;

            const confidence = text.length > 50 ? 0.90 : 0.40;

            return {
                text: text.trim(),
                confidence: confidence
            };
        }

        // --- IMAGE HANDLING (Vision API) ---
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "You are an OCR engine. Read ALL visible text in this document image clearly and accurately. Return ONLY the raw text found, preserving layout structure where possible. Do not interpret or summarize." },
                        {
                            type: "image_url",
                            image_url: {
                                url: dataUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const extractedText = response.choices[0].message.content;
        const mockConfidence = extractedText && extractedText.length > 20 ? 0.95 : 0.4;

        return {
            text: extractedText,
            confidence: mockConfidence
        };

    } catch (error) {
        console.error("OCR Service Error:", error);
        throw new Error(`OCR Processing Failed: ${error.message}`);
    }
};
