import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractTextFromImage } from '../services/ocr.service.js';
import { parseDocumentData } from '../services/llm.service.js';
import { determineDocumentType } from '../services/detectDocumentType.js';
import { verifyPassport } from '../services/verification/passport.js';
import { verifyNationalID } from '../services/verification/id.js';
import { verifyDrivingLicense } from '../services/verification/driving_license.js';
import { calculateConfidence } from '../services/confidence.service.js';
import { sendVerificationEmail } from '../services/email.service.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const startTime = Date.now();
    const filePath = req.file.path;
    const { email, metadataType } = req.body;

    try {
        console.log(`\n--- Processing File: ${req.file.originalname} ---`);

        console.log("1. Running Vision/OCR...");
        const { text: ocrText, confidence: ocrConfidence } = await extractTextFromImage(filePath);

        console.log("2. Running LLM Analysis...");
        const extractedData = await parseDocumentData(ocrText);

        const detectedType = determineDocumentType(metadataType, extractedData.document_type, req.file.originalname);
        console.log(`   Detected Type: ${detectedType}`);

        console.log("3. Executing Rule Engine...");
        let verificationResult;
        switch (detectedType) {
            case 'passport':
                verificationResult = verifyPassport(extractedData);
                break;
            case 'national_id':
                verificationResult = verifyNationalID(extractedData);
                break;
            case 'driving_license':
                verificationResult = verifyDrivingLicense(extractedData);
                break;
            case 'other':
            default:
                verificationResult = {
                    verified: false,
                    results: [{ rule: 'Type Support', status: 'FAILED', details: `Detected type '${detectedType}' not supported` }]
                };
        }

        const confidenceScore = calculateConfidence(ocrConfidence, extractedData.confidence_indication, verificationResult);

        const finalStatus = verificationResult.verified ? 'Verified' : 'Failed';

        // Email logic (kept same, assuming email sending works if config is present)
        if (email) {
            // Async to not block response
            sendVerificationEmail(email, {
                status: finalStatus,
                documentType: detectedType,
                confidenceScore,
                verificationDetails: verificationResult.results,
                documentNumber: extractedData.document_number
            }).catch(err => console.error("Email error:", err));
        }

        fs.unlink(filePath, (err) => {
            if (err) console.error("Warning: Failed to delete temp file", err);
        });

        const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

        res.json({
            success: true,
            data: {
                status: finalStatus,
                confidence_score: confidenceScore,
                document_type: detectedType,
                extracted_data: {
                    document_number: extractedData.document_number,
                    expiry_date: extractedData.expiry_date
                },
                verification_details: verificationResult.results,
                processing_time_seconds: processingTime
            }
        });

    } catch (error) {
        console.error("Processing Error:", error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
