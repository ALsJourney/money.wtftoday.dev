import {useState, useEffect, useCallback} from "react";

export function useAsyncData<T>(asyncFunction: () => Promise<T>, dependencies: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await asyncFunction();
            setData(result);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [asyncFunction]);

    useEffect(() => {
        let isMounted = true;

        const performFetch = async () => {
            try {
                const result = await asyncFunction();
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err as Error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        performFetch();

        return () => {
            isMounted = false;
        };
    }, dependencies);

    return {data, loading, error, refetch: fetchData};
}