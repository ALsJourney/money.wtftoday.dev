import {FinanceSummary} from "@/types/finance-summary";

type FetchOptions = RequestInit & {
    params?: Record<string, string | number | boolean>;
    baseUrl?: string;
};

// The base URL of your Hono API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8558';

/**
 * A wrapper around fetch specifically for Hono API requests
 */
export async function honoFetch<T = any>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const {
        params = {},
        baseUrl = API_BASE_URL,
        headers = {},
        ...fetchOptions
    } = options;

    // Build URL with query parameters
    const url = new URL(endpoint, baseUrl);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
        }
    });

    // Set default headers
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
    };

    // Perform the fetch
    const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers: defaultHeaders,
        credentials: 'include',
    });

    // Handle error responses
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = new Error(
            `API request failed with status ${response.status}: ${response.statusText}`
        ) as Error & { status?: number; data?: FinanceSummary };

        error.status = response.status;
        error.data = errorData;

        throw error;
    }

    // Return JSON response for JSON content types, otherwise return the response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response as unknown as T;
}

