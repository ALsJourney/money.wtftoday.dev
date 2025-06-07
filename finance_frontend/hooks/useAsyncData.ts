import {useState, useEffect} from "react";

export function useAsyncData<T>(asyncFunction: () => Promise<T>, dependencies: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            try {
                setLoading(true);
                const result = await asyncFunction();
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err as Error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, dependencies);

    return {data, loading, error};
}