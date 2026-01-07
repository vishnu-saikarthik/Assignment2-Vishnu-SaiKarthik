/**
 * Document Type Detector
 * Combines explicit user/metadata hints with LLM analysis.
 */

export const determineDocumentType = (metadataType, llmDetectedType, fileName) => {
    const normalize = (t) => (t || '').toLowerCase().replace(' ', '_');
    const validTypes = ['passport', 'national_id', 'driving_license'];

    // 1. Trust explicit backend intelligence (LLM) if it found a known type
    if (llmDetectedType && validTypes.includes(normalize(llmDetectedType))) {
        return normalize(llmDetectedType);
    }

    // 2. Metadata fallback (Frontend dropdown)
    if (metadataType && validTypes.includes(normalize(metadataType))) {
        return normalize(metadataType);
    }

    // 3. File naming heuristics
    const fileNameLower = (fileName || '').toLowerCase();
    if (fileNameLower.includes('passport')) return 'passport';
    if (fileNameLower.includes('id') || fileNameLower.includes('card')) return 'national_id';
    if (fileNameLower.includes('driving') || fileNameLower.includes('license') || fileNameLower.includes('dl')) return 'driving_license';

    return 'other';
};
