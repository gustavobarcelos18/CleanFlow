import { PostgrestResponse, PostgrestError } from '@supabase/supabase-js';

/**
 * Executes a Supabase query and handles missing table errors (42P01) gracefully.
 * Returns empty data and no error if the table doesn't exist.
 * 
 * @param queryPromise The Supabase query promise
 * @param fallbackValue The value to return if the table is missing (default: empty array)
 * @returns An object with data and error, similar to Supabase's response
 */
export async function safeFetch<T = unknown>(
    queryPromise: PromiseLike<PostgrestResponse<T>>,
    fallbackValue: T[] = []
): Promise<{ data: T[]; error: PostgrestError | null }> {
    try {
        const response = await queryPromise;

        if (response.error) {
            if (response.error.code === '42P01') {
                console.warn(`[SafeFetch] Table not found. Returning fallback. Table error: ${response.error.message}`);
                return { data: fallbackValue, error: null };
            }
            return { data: response.data || fallbackValue, error: response.error };
        }

        return { data: response.data || fallbackValue, error: null };
    } catch (err) {
        console.error('[SafeFetch] Unexpected error in safeFetch:', err);
        return { data: fallbackValue, error: null };
    }
}

/**
 * Similar to safeFetch but for single row queries
 */
export async function safeFetchSingle<T = unknown>(
    queryPromise: PromiseLike<{ data: T | null; error: PostgrestError | null }>,
    fallbackValue: T | null = null
): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
        const { data, error } = await queryPromise;

        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST116') {
                return { data: fallbackValue, error: null };
            }
            return { data, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[SafeFetch] Unexpected error in safeFetchSingle:', err);
        return { data: fallbackValue, error: null };
    }
}
