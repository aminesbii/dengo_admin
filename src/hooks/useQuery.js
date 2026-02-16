import { useState, useEffect, useCallback, useRef } from "react";

// Simple cache for storing query results
const queryCache = new Map();
const querySubscribers = new Map();

/**
 * Custom useQuery hook to replace TanStack React Query
 * @param {Object} options - Query options
 * @param {string[]} options.queryKey - Unique key for the query
 * @param {Function} options.queryFn - Function that returns a promise
 * @param {boolean} options.enabled - Whether the query should run
 * @param {number} options.staleTime - Time in ms before data is considered stale
 * @param {number} options.cacheTime - Time in ms to keep data in cache
 */
export function useQuery({ queryKey, queryFn, enabled = true, staleTime = 0, cacheTime = 5 * 60 * 1000 }) {
  const keyString = JSON.stringify(queryKey);
  const [state, setState] = useState(() => {
    const cached = queryCache.get(keyString);
    return {
      data: cached?.data ?? undefined,
      isLoading: !cached?.data && enabled,
      isError: false,
      error: null,
      isFetching: enabled,
    };
  });

  const isMounted = useRef(true);
  const queryFnRef = useRef(queryFn);
  const prevKeyRef = useRef(keyString);
  
  // Update queryFn ref without causing re-renders
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first
    const cached = queryCache.get(keyString);
    const now = Date.now();

    if (!forceRefresh && cached && now - cached.timestamp < staleTime) {
      if (isMounted.current) {
        setState({
          data: cached.data,
          isLoading: false,
          isError: false,
          error: null,
          isFetching: false,
        });
      }
      return;
    }

    if (isMounted.current) {
      setState((prev) => ({
        ...prev,
        isLoading: !prev.data,
        isFetching: true,
      }));
    }

    try {
      const data = await queryFnRef.current();

      // Update cache
      queryCache.set(keyString, { data, timestamp: Date.now() });

      // Notify all subscribers
      const subscribers = querySubscribers.get(keyString) || [];
      subscribers.forEach((callback) => callback(data));

      if (isMounted.current) {
        setState({
          data,
          isLoading: false,
          isError: false,
          error: null,
          isFetching: false,
        });
      }

      // Set up cache expiration
      setTimeout(() => {
        const currentCache = queryCache.get(keyString);
        if (currentCache && Date.now() - currentCache.timestamp >= cacheTime) {
          queryCache.delete(keyString);
        }
      }, cacheTime);
    } catch (error) {
      if (isMounted.current) {
        setState({
          data: undefined,
          isLoading: false,
          isError: true,
          error,
          isFetching: false,
        });
      }
    }
  }, [keyString, enabled, staleTime, cacheTime]);

  // Subscribe to cache updates
  useEffect(() => {
    const subscribers = querySubscribers.get(keyString) || [];
    const callback = (data) => {
      if (isMounted.current) {
        setState((prev) => ({ ...prev, data }));
      }
    };
    subscribers.push(callback);
    querySubscribers.set(keyString, subscribers);

    return () => {
      const subs = querySubscribers.get(keyString) || [];
      const index = subs.indexOf(callback);
      if (index > -1) {
        subs.splice(index, 1);
      }
    };
  }, [keyString]);

  // Fetch on mount and when keyString changes
  useEffect(() => {
    isMounted.current = true;
    
    // Only fetch if key actually changed or on initial mount
    if (prevKeyRef.current !== keyString || !queryCache.has(keyString)) {
      prevKeyRef.current = keyString;
      fetchData();
    }

    return () => {
      isMounted.current = false;
    };
  }, [keyString, fetchData]);

  const refetch = useCallback(() => {
    // Clear cache to force refetch
    queryCache.delete(keyString);
    fetchData(true);
  }, [keyString, fetchData]);

  return { ...state, refetch };
}

/**
 * Custom useMutation hook to replace TanStack React Query
 * @param {Object} options - Mutation options
 * @param {Function} options.mutationFn - Function that performs the mutation
 * @param {Function} options.onSuccess - Callback on success
 * @param {Function} options.onError - Callback on error
 */
export function useMutation({ mutationFn, onSuccess, onError, onSettled }) {
  const [state, setState] = useState({
    data: undefined,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables) => {
      setState({
        data: undefined,
        isLoading: true,
        isPending: true,
        isError: false,
        isSuccess: false,
        error: null,
      });

      try {
        const data = await mutationFn(variables);

        setState({
          data,
          isLoading: false,
          isPending: false,
          isError: false,
          isSuccess: true,
          error: null,
        });

        if (onSuccess) {
          onSuccess(data, variables);
        }

        if (onSettled) {
          onSettled(data, null, variables);
        }

        return data;
      } catch (error) {
        setState({
          data: undefined,
          isLoading: false,
          isPending: false,
          isError: true,
          isSuccess: false,
          error,
        });

        if (onError) {
          onError(error, variables);
        }

        if (onSettled) {
          onSettled(undefined, error, variables);
        }

        throw error;
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutateAsync = mutate;

  const reset = useCallback(() => {
    setState({
      data: undefined,
      isLoading: false,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    });
  }, []);

  return { ...state, mutate, mutateAsync, reset };
}

/**
 * Custom useQueryClient hook to replace TanStack React Query
 * Returns methods to interact with the query cache
 */
export function useQueryClient() {
  const invalidateQueries = useCallback(({ queryKey }) => {
    const keyString = JSON.stringify(queryKey);
    
    // Find all matching keys (supports partial matching)
    for (const [cacheKey] of queryCache) {
      if (cacheKey === keyString || cacheKey.startsWith(keyString.slice(0, -1))) {
        queryCache.delete(cacheKey);
        
        // Notify subscribers to refetch
        const subscribers = querySubscribers.get(cacheKey) || [];
        subscribers.forEach((callback) => callback(undefined));
      }
    }
  }, []);

  const setQueryData = useCallback((queryKey, updater) => {
    const keyString = JSON.stringify(queryKey);
    const cached = queryCache.get(keyString);
    const newData = typeof updater === "function" ? updater(cached?.data) : updater;

    queryCache.set(keyString, { data: newData, timestamp: Date.now() });

    // Notify subscribers
    const subscribers = querySubscribers.get(keyString) || [];
    subscribers.forEach((callback) => callback(newData));
  }, []);

  const getQueryData = useCallback((queryKey) => {
    const keyString = JSON.stringify(queryKey);
    return queryCache.get(keyString)?.data;
  }, []);

  const removeQueries = useCallback(({ queryKey }) => {
    const keyString = JSON.stringify(queryKey);
    queryCache.delete(keyString);
    querySubscribers.delete(keyString);
  }, []);

  const clear = useCallback(() => {
    queryCache.clear();
    querySubscribers.clear();
  }, []);

  return {
    invalidateQueries,
    setQueryData,
    getQueryData,
    removeQueries,
    clear,
  };
}

export default { useQuery, useMutation, useQueryClient };
