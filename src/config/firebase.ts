import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  RatingScale,
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
} from "../types/survey.types";

// Your Firebase configuration
// Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Singleton pattern to prevent multiple Firebase instances
let firebaseApp: any = null;
let firestoreDb: any = null;
let surveysCol: any = null;
let surveyConfigsCol: any = null;
let surveyInstancesCol: any = null;
let surveyResponsesCol: any = null;
let ratingScalesCol: any = null;
let authInstance: any = null;

// Initialize Firebase (singleton)
function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp);
    authInstance = getAuth(firebaseApp);
    surveysCol = collection(firestoreDb, "surveys");
    surveyConfigsCol = collection(firestoreDb, "survey_configs");
    surveyInstancesCol = collection(firestoreDb, "survey_instances");
    surveyResponsesCol = collection(firestoreDb, "survey_responses");
    ratingScalesCol = collection(firestoreDb, "rating_scales");

    // Disable real-time listeners to prevent connection spam
    // We only need one-time reads and writes
    console.log("Firebase initialized with real-time listeners disabled");
  }
  return {
    app: firebaseApp,
    db: firestoreDb,
    surveysCollection: surveysCol,
    surveyConfigsCollection: surveyConfigsCol,
    surveyInstancesCollection: surveyInstancesCol,
    surveyResponsesCollection: surveyResponsesCol,
    ratingScalesCollection: ratingScalesCol,
    auth: authInstance,
  };
}

// Get Firebase instances
const {
  db: firestoreInstance,
  surveysCollection: surveysCollectionInstance,
  surveyConfigsCollection: surveyConfigsCollectionInstance,
  surveyInstancesCollection: surveyInstancesCollectionInstance,
  surveyResponsesCollection: surveyResponsesCollectionInstance,
  ratingScalesCollection: ratingScalesCollectionInstance,
  auth: authInstanceExport,
} = initializeFirebase();

export const db = firestoreInstance;
export const surveysCollection = surveysCollectionInstance;
export const surveyConfigsCollection = surveyConfigsCollectionInstance;
export const surveyInstancesCollection = surveyInstancesCollectionInstance;
export const surveyResponsesCollection = surveyResponsesCollectionInstance;
export const auth = authInstanceExport;

// Authentication helper functions
export const authHelpers = {
  // Sign in anonymously
  async signInAnonymously() {
    try {
      const userCredential = await signInAnonymously(authInstanceExport);
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser() {
    return authInstanceExport.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: any) => void) {
    return onAuthStateChanged(authInstanceExport, callback);
  },
};

// Firestore helper functions
export const firestoreHelpers = {
  // Legacy survey functions (backward compatibility)
  async getSurveys() {
    try {
      const q = query(surveysCollection, orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const surveys = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      return surveys;
    } catch (error) {
      console.error("Error getting surveys:", error);
      throw error;
    }
  },

  async addSurvey(surveyData: any) {
    try {
      console.log("Adding survey to Firebase...");
      const docRef = await addDoc(surveysCollection, {
        ...surveyData,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      console.log("Survey added successfully to Firebase");
      return { id: docRef.id, ...surveyData };
    } catch (error) {
      console.error("Error adding survey:", error);
      throw error;
    }
  },

  async updateSurvey(id: string, data: any) {
    try {
      const surveyRef = doc(db, "surveys", id);
      await updateDoc(surveyRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating survey:", error);
      throw error;
    }
  },

  async deleteSurvey(id: string) {
    try {
      const surveyRef = doc(db, "surveys", id);
      await deleteDoc(surveyRef);
    } catch (error) {
      console.error("Error deleting survey:", error);
      throw error;
    }
  },

  // New Framework Functions
  // Survey Configs
  async getSurveyConfigs() {
    try {
      const q = query(
        surveyConfigsCollection,
        orderBy("metadata.createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const configs = querySnapshot.docs.map((doc) => {
        const data = doc.data() as SurveyConfig;
        return {
          ...data,
          id: doc.id, // Use document ID as the primary ID
        };
      });
      return configs;
    } catch (error) {
      console.error("Error getting survey configs:", error);
      throw error;
    }
  },

  async getSurveyConfig(id: string) {
    try {
      console.log("Looking for survey config with ID:", id);
      const configRef = doc(db, "survey_configs", id);
      const configDoc = await getDoc(configRef);
      console.log("Document exists:", configDoc.exists());
      if (configDoc.exists()) {
        const data = configDoc.data();
        console.log("Document data:", data);
        const configData = data as SurveyConfig;
        return { ...configData, id: configDoc.id };
      }
      console.log("Document does not exist for ID:", id);
      return null;
    } catch (error) {
      console.error("Error getting survey config:", error);
      throw error;
    }
  },

  async addSurveyConfig(config: Omit<SurveyConfig, "id">) {
    try {
      const configId = crypto.randomUUID();
      const configRef = doc(db, "survey_configs", configId);
      await setDoc(configRef, {
        ...config,
        metadata: {
          ...config.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return { id: configId, ...config };
    } catch (error) {
      console.error("Error adding survey config:", error);
      throw error;
    }
  },

  async updateSurveyConfig(id: string, data: Partial<SurveyConfig>) {
    try {
      const configRef = doc(db, "survey_configs", id);
      await updateDoc(configRef, {
        ...data,
        metadata: {
          ...data.metadata,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error updating survey config:", error);
      throw error;
    }
  },

  async deleteSurveyConfig(id: string) {
    try {
      const configRef = doc(db, "survey_configs", id);
      await deleteDoc(configRef);
    } catch (error) {
      console.error("Error deleting survey config:", error);
      throw error;
    }
  },

  // Survey Instances
  async getSurveyInstances() {
    try {
      const q = query(
        surveyInstancesCollection,
        orderBy("metadata.createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const instances = querySnapshot.docs.map((doc) => {
        const data = doc.data() as SurveyInstance;
        return {
          ...data,
          id: doc.id,
        };
      });
      return instances;
    } catch (error) {
      console.error("Error getting survey instances:", error);
      throw error;
    }
  },

  async getActiveSurveyInstance() {
    try {
      const q = query(
        surveyInstancesCollection,
        where("isActive", "==", true),
        orderBy("metadata.createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const now = new Date();

      // Find the first instance that is active and within its date range (if specified)
      for (const doc of querySnapshot.docs) {
        const data = doc.data() as SurveyInstance;
        const instance = { ...data, id: doc.id };

        // If no date range is specified, the instance is always active
        if (!instance.activeDateRange) {
          return instance;
        }

        // Check if current time is within the date range
        const startDate = new Date(instance.activeDateRange.startDate);
        const endDate = new Date(instance.activeDateRange.endDate);

        if (now >= startDate && now <= endDate) {
          return instance;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting active survey instance:", error);
      throw error;
    }
  },

  async addSurveyInstance(instance: Omit<SurveyInstance, "id">) {
    try {
      const docRef = await addDoc(surveyInstancesCollection, {
        ...instance,
        metadata: {
          ...instance.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return { id: docRef.id, ...instance };
    } catch (error) {
      console.error("Error adding survey instance:", error);
      throw error;
    }
  },

  async updateSurveyInstance(id: string, data: Partial<SurveyInstance>) {
    try {
      const instanceRef = doc(db, "survey_instances", id);
      await updateDoc(instanceRef, {
        ...data,
        metadata: {
          ...data.metadata,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error updating survey instance:", error);
      throw error;
    }
  },

  async deleteSurveyInstance(id: string) {
    try {
      const instanceRef = doc(db, "survey_instances", id);
      await deleteDoc(instanceRef);
    } catch (error) {
      console.error("Error deleting survey instance:", error);
      throw error;
    }
  },

  // Survey Responses
  async addSurveyResponse(response: Omit<SurveyResponse, "id">) {
    try {
      const docRef = await addDoc(surveyResponsesCollection, {
        ...response,
        metadata: {
          ...response.metadata,
          submittedAt: new Date().toISOString(),
        },
      });
      return { id: docRef.id, ...response };
    } catch (error) {
      console.error("Error adding survey response:", error);
      throw error;
    }
  },

  async getSurveyResponses(instanceId?: string) {
    try {
      let q = query(
        surveyResponsesCollection,
        orderBy("metadata.submittedAt", "desc")
      );
      if (instanceId) {
        q = query(
          surveyResponsesCollection,
          where("surveyInstanceId", "==", instanceId),
          orderBy("metadata.submittedAt", "desc")
        );
      }
      const querySnapshot = await getDocs(q);
      const responses = querySnapshot.docs.map((doc) => {
        const data = doc.data() as SurveyResponse;
        return {
          ...data,
          id: doc.id,
        };
      });
      return responses;
    } catch (error) {
      console.error("Error getting survey responses:", error);
      throw error;
    }
  },

  // Rating Scales
  async getRatingScales() {
    try {
      const q = query(ratingScalesCol, orderBy("metadata.createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const scales = querySnapshot.docs.map((doc) => {
        const data = doc.data() as RatingScale;
        return {
          ...data,
          id: doc.id,
        };
      });
      return scales;
    } catch (error) {
      console.error("Error getting rating scales:", error);
      throw error;
    }
  },

  async getRatingScale(id: string) {
    try {
      const scaleRef = doc(db, "rating_scales", id);
      const scaleDoc = await getDoc(scaleRef);
      if (scaleDoc.exists()) {
        const data = scaleDoc.data() as RatingScale;
        return { ...data, id: scaleDoc.id };
      }
      return null;
    } catch (error) {
      console.error("Error getting rating scale:", error);
      throw error;
    }
  },

  async addRatingScale(scale: Omit<RatingScale, "id">) {
    try {
      const scaleId = crypto.randomUUID();
      const scaleRef = doc(db, "rating_scales", scaleId);
      await setDoc(scaleRef, {
        ...scale,
        metadata: {
          ...scale.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return { id: scaleId, ...scale };
    } catch (error) {
      console.error("Error adding rating scale:", error);
      throw error;
    }
  },

  async updateRatingScale(id: string, data: Partial<RatingScale>) {
    try {
      const scaleRef = doc(db, "rating_scales", id);
      await updateDoc(scaleRef, {
        ...data,
        metadata: {
          ...data.metadata,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error updating rating scale:", error);
      throw error;
    }
  },

  async deleteRatingScale(id: string) {
    try {
      const scaleRef = doc(db, "rating_scales", id);
      await deleteDoc(scaleRef);
    } catch (error) {
      console.error("Error deleting rating scale:", error);
      throw error;
    }
  },
};

export default firebaseApp;
