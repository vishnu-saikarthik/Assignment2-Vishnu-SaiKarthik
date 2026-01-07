/**
 * Confidence Scoring Service
 * Aggregates OCR quality, LLM certainty, and Rule Verification results
 * into a single normalized score (0.0 to 1.0).
 */
export const calculateConfidence = (ocrConfidence, llmIndication, verificationResult) => {
    let score = 0;

    // W1: OCR Confidence (Weight: 30%)
    score += (ocrConfidence || 0) * 0.3;

    // W2: LLM Confidence Indication (Weight: 20%)
    const llmScoreMap = { 'high': 1.0, 'medium': 0.7, 'low': 0.4 };
    const llmScore = llmScoreMap[llmIndication] || 0.5;
    score += llmScore * 0.2;

    // W3: Verification Rules (Weight: 50%)
    // If verified=true, full score. If false, proportional to passed rules.
    if (verificationResult.verified) {
        score += 0.5;
    } else {
        // Calculate ratio of passed rules
        const totalRules = verificationResult.results.length;
        const passedRules = verificationResult.results.filter(r => r.status === 'PASSED').length;

        if (totalRules > 0) {
            score += (passedRules / totalRules) * 0.5;
        }
    }

    // Normalize to max 2 decimal places
    return Math.round(score * 100) / 100;
};
