import { firestoreHelpers } from "@/config/firebase";
import { STORAGE_KEYS } from "@/constants";
import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

// Global flags to prevent multiple simultaneous requests and connections
let isLoading = false;
let isSaving = false;
let connectionInitialized = false;

export interface FirebaseStorageReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  save: (item: T) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFirebaseStorage = <T>(): FirebaseStorageReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const { setValue: setLocalData } = useLocalStorage<T[]>(
    STORAGE_KEYS.surveyData,
    []
  );

  // Load data from Firebase
  const loadData = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log("Data loading already in progress, skipping");
      return;
    }

    // Only load once per session
    if (connectionInitialized) {
      console.log("Firebase connection already initialized, using cached data");
      return;
    }

    isLoading = true;
    setLoading(true);
    setError(null);

    try {
      // Load from Firebase
      const firebaseData = await firestoreHelpers.getSurveys();
      setData(firebaseData as T[]);
      setLocalData(firebaseData as T[]);
      setConnected(true);
      connectionInitialized = true;
    } catch (err) {
      console.error("Error loading from Firebase:", err);
      setError("Failed to load from Firebase.");
      setConnected(false);
    } finally {
      setLoading(false);
      isLoading = false;
    }
  }, [setLocalData]); // Add setLocalData dependency

  // Save data to Firebase
  const save = useCallback(
    async (item: T): Promise<void> => {
      // Prevent multiple simultaneous saves
      if (isSaving) {
        console.log("Save already in progress, skipping");
        return;
      }

      isSaving = true;
      try {
        // Save to Firebase
        await firestoreHelpers.addSurvey(item);

        // Update local state after successful save
        setData((prevData) => {
          const newData = [...prevData, item];
          setLocalData(newData);
          return newData;
        });
        setConnected(true);
        console.log("Successfully saved to Firebase");
      } catch (err) {
        console.error("Error saving to Firebase:", err);
        setError("Failed to save to Firebase.");
        setConnected(false);
      } finally {
        isSaving = false;
      }
    },
    [setLocalData]
  );

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    isLoading = false; // Reset loading flag
    connectionInitialized = false; // Allow fresh load
    await loadData();
  }, [loadData]);

  // Load data on mount - only once
  useEffect(() => {
    // Add a small delay to prevent rapid successive calls
    const timer = setTimeout(() => {
      loadData();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadData]); // Include loadData dependency

  return {
    data,
    loading,
    error,
    connected,
    save,
    refresh,
  };
};
