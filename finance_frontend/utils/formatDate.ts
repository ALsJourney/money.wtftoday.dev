export const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';

    try {
        // Handle various date formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        // Format to YYYY-MM-DD for date input
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

export const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

