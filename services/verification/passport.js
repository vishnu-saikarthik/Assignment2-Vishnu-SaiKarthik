import dayjs from 'dayjs';

/**
 * Deterministic Passport Verification Rules
 * @param {Object} data - Extracted document data
 * @returns {Object} Verification result
 */
export const verifyPassport = (data) => {
    const results = [];
    let isValid = true;

    // Rule 1: Passport Number Format (9 alphanumeric characters)
    // Common standard, though varies by country. Using generic 9-char alphanumeric for this requirement.
    const passportNumberRegex = /^[A-Z0-9]{9}$/i;
    const isNumberValid = passportNumberRegex.test(data.document_number);

    if (!isNumberValid) {
        isValid = false;
        results.push({
            rule: 'Passport Number Format',
            status: 'FAILED',
            details: `Value '${data.document_number}' does not match 9-character alphanumeric format`
        });
    } else {
        results.push({
            rule: 'Passport Number Format',
            status: 'PASSED',
            details: 'Valid format'
        });
    }

    // Rule 2: Expiry Date Check (Must be at least 6 months in the future)
    if (data.expiry_date) {
        const expiry = dayjs(data.expiry_date);
        const sixMonthsFromNow = dayjs().add(6, 'month');

        // Check if date is valid
        if (!expiry.isValid()) {
            isValid = false;
            results.push({
                rule: 'Expiry Date Validity',
                status: 'FAILED',
                details: 'Invalid date format'
            });
        } else {
            const isSixMonthsValid = expiry.isAfter(sixMonthsFromNow);

            if (!isSixMonthsValid) {
                isValid = false;
                results.push({
                    rule: 'Travel Validity (6 Months Rule)',
                    status: 'FAILED',
                    details: `Expiry date ${expiry.format('YYYY-MM-DD')} is less than 6 months from today`
                });
            } else {
                results.push({
                    rule: 'Travel Validity (6 Months Rule)',
                    status: 'PASSED',
                    details: 'Expiry is valid for travel (> 6 months)'
                });
            }
        }
    } else {
        // If field is missing but required
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
