import dayjs from 'dayjs';

/**
 * Deterministic National ID Verification Rules
 * @param {Object} data - Extracted document data
 * @returns {Object} Verification result
 */
export const verifyNationalID = (data) => {
    const results = [];
    let isValid = true;

    // Rule 1: ID Number Format (Exactly 8 digits)
    // As per requirements: "ID number must be exactly 8 digits"
    const idRegex = /^\d{8}$/;
    const isNumberValid = idRegex.test(data.document_number);

    if (!isNumberValid) {
        isValid = false;
        results.push({
            rule: 'National ID Number Format',
            status: 'FAILED',
            details: `Value '${data.document_number}' is not exactly 8 digits`
        });
    } else {
        results.push({
            rule: 'National ID Number Format',
            status: 'PASSED',
            details: 'Valid 8-digit format'
        });
    }

    // Rule 2: Expiry Check (Must not be expired)
    if (data.expiry_date) {
        const expiry = dayjs(data.expiry_date);
        const now = dayjs();

        if (!expiry.isValid()) {
            isValid = false;
            results.push({
                rule: 'Expiry Date Validity',
                status: 'FAILED',
                details: 'Invalid date format'
            });
        } else {
            const isNotExpired = expiry.isAfter(now);

            if (!isNotExpired) {
                isValid = false;
                results.push({
                    rule: 'Document Active Status',
                    status: 'FAILED',
                    details: `Document expired on ${expiry.format('YYYY-MM-DD')}`
                });
            } else {
                results.push({
                    rule: 'Document Active Status',
                    status: 'PASSED',
                    details: 'Document is active (not expired)'
                });
            }
        }
    } else {
        isValid = false;
        results.push({
            rule: 'Expiry Date Presence',
            status: 'FAILED',
            details: 'Expiry date field missing'
        });
    }

    return {
        verified: isValid,
        results
    };
};
