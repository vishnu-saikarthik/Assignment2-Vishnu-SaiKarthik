import dayjs from 'dayjs';

/**
 * Deterministic Driving License Verification Rules
 * @param {Object} data - Extracted document data
 * @returns {Object} Verification result
 */
export const verifyDrivingLicense = (data) => {
    const results = [];
    let isValid = true;

    // Rule 1: Document Number Presence
    // Driving license formats are very diverse globally, so we primarily check for presence/length.
    if (data.document_number && data.document_number.length >= 5) {
        results.push({
            rule: 'License Number Format',
            status: 'PASSED',
            details: `Present and valid length (${data.document_number.length} chars)`
        });
    } else {
        isValid = false;
        results.push({
            rule: 'License Number Format',
            status: 'FAILED',
            details: 'Missing or too short (< 5 chars)'
        });
    }

    // Rule 2: Expiry Check
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
                    rule: 'License Active Status',
                    status: 'FAILED',
                    details: `License expired on ${expiry.format('YYYY-MM-DD')}`
                });
            } else {
                results.push({
                    rule: 'License Active Status',
                    status: 'PASSED',
                    details: 'License is active (not expired)'
                });
            }
        }
    } else {
        // Some licenses might not have expiry extracted, but strict verification requires it
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
