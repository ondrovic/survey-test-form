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
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
} from "../types/framework.types";
import {
  createMetadata,
  mergeMetadata,
  updateMetadata,
} from "../utils/metadata.utils";

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
let ratingOptionSetsCol: any = null;
let radioOptionSetsCol: any = null;
let multiSelectOptionSetsCol: any = null;
let selectOptionSetsCol: any = null;
let authInstance: any = null;

// Initialize Firebase (singleton)
function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp);
    authInstance = getAuth(firebaseApp);
    surveysCol = collection(firestoreDb, "surveys");
    surveyConfigsCol = collection(firestoreDb, "survey-configs");
    surveyInstancesCol = collection(firestoreDb, "survey-instances");
    surveyResponsesCol = collection(firestoreDb, "survey-responses");
    ratingOptionSetsCol = collection(firestoreDb, "rating-option-sets");
    radioOptionSetsCol = collection(firestoreDb, "radio-option-sets");

    multiSelectOptionSetsCol = collection(
      firestoreDb,
      "multi-select-option-sets"
    );
    selectOptionSetsCol = collection(firestoreDb, "select-option-sets");

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
    ratingOptionSetsCollection: ratingOptionSetsCol,
    radioOptionSetsCollection: radioOptionSetsCol,
    multiSelectOptionSetsCollection: multiSelectOptionSetsCol,
    selectOptionSetsCollection: selectOptionSetsCol,
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
  ratingOptionSetsCollection: ratingScalesCollectionInstance,
  radioOptionSetsCollection: radioOptionSetsCollectionInstance,
  multiSelectOptionSetsCollection: multiSelectOptionSetsCollectionInstance,
  selectOptionSetsCollection: selectOptionSetsCollectionInstance,
  auth: authInstanceExport,
} = initializeFirebase();

export const db = firestoreInstance;
export const surveysCollection = surveysCollectionInstance;
export const surveyConfigsCollection = surveyConfigsCollectionInstance;
export const surveyInstancesCollection = surveyInstancesCollectionInstance;
export const surveyResponsesCollection = surveyResponsesCollectionInstance;
export const ratingScalesCollection = ratingScalesCollectionInstance;
export const radioOptionSetsCollection = radioOptionSetsCollectionInstance;
export const multiSelectOptionSetsCollection =
  multiSelectOptionSetsCollectionInstance;
export const selectOptionSetsCollection = selectOptionSetsCollectionInstance;
export const auth = authInstanceExport;

// Helper function to create human-readable, kebab-case document IDs
const createKebabCaseId = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// Helper function to create unique survey instance IDs with counter
const createUniqueInstanceId = async (baseTitle: string): Promise<string> => {
  const baseId = createKebabCaseId(baseTitle);

  // Get all existing instances that start with this base ID
  const q = query(surveyInstancesCol);
  const querySnapshot = await getDocs(q);
  const existingIds = querySnapshot.docs.map((doc) => doc.id);

  // Find existing instances with the same base
  const matchingIds = existingIds.filter((id) => id.startsWith(baseId));

  if (matchingIds.length === 0) {
    // No existing instances, use base ID with -001
    return `${baseId}-001`;
  }

  // Extract counters from existing IDs
  const counters = matchingIds
    .map((id) => {
      const match = id.match(new RegExp(`^${baseId}-(\\d{3})$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((counter) => counter > 0);

  // Find the next available counter
  const nextCounter = counters.length > 0 ? Math.max(...counters) + 1 : 1;
  return `${baseId}-${nextCounter.toString().padStart(3, "0")}`;
};

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
      const updateData = { ...data };
      if (data.metadata) {
        updateData.metadata = updateMetadata(data.metadata);
      } else {
        updateData.metadata = updateMetadata(await createMetadata());
      }
      await updateDoc(surveyRef, updateData);
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
      // Try to order by metadata.createdAt for backward compatibility
      // TODO: After migration, can simplify to just metadata.createdAt
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
      const configRef = doc(db, "survey-configs", id);
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
      // Use human-readable, kebab-case name for document ID
      const configId = createKebabCaseId(config.title);
      const configRef = doc(db, "survey-configs", configId);
      const configData = {
        ...config,
        id: configId,
        // Ensure business logic fields are set
        isActive: config.isActive ?? true,
        version: config.version || "1.0.0",
        metadata: await mergeMetadata(config.metadata),
      };
      await setDoc(configRef, configData);
      return configData;
    } catch (error) {
      console.error("Error adding survey config:", error);
      throw error;
    }
  },

  async updateSurveyConfig(id: string, data: Partial<SurveyConfig>) {
    try {
      const configRef = doc(db, "survey-configs", id);
      const updateData = { ...data };
      if (data.metadata) {
        updateData.metadata = updateMetadata(data.metadata as any);
      } else {
        updateData.metadata = updateMetadata(await createMetadata());
      }
      await updateDoc(configRef, updateData);
    } catch (error) {
      console.error("Error updating survey config:", error);
      throw error;
    }
  },

  async deleteSurveyConfig(id: string) {
    try {
      const configRef = doc(db, "survey-configs", id);
      await deleteDoc(configRef);
    } catch (error) {
      console.error("Error deleting survey config:", error);
      throw error;
    }
  },

  // Survey Instances
  async getSurveyInstances() {
    try {
      const q = query(surveyInstancesCol);
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

  async getSurveyInstancesByConfig(configId: string) {
    try {
      const q = query(surveyInstancesCol, where("configId", "==", configId));
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
      console.error("Error getting survey instances by config:", error);
      throw error;
    }
  },

  // async getActiveSurveyInstance() {
  //   try {
  //     const q = query(
  //       surveyInstancesCollection,
  //       where("isActive", "==", true),
  //       orderBy("metadata.createdAt", "desc")
  //     );
  //     const querySnapshot = await getDocs(q);
  //     const now = new Date();

  //     // Find the first instance that is active and within its date range (if specified)
  //     for (const doc of querySnapshot.docs) {
  //       const data = doc.data() as SurveyInstance;
  //       const instance = { ...data, id: doc.id };

  //       // If no date range is specified, the instance is always active
  //       if (!instance.activeDateRange) {
  //         return instance;
  //       }

  //       // Check if current time is within the date range
  //       const startDate = new Date(instance.activeDateRange.startDate);
  //       const endDate = new Date(instance.activeDateRange.endDate);

  //       if (now >= startDate && now <= endDate) {
  //         return instance;
  //       }
  //     }

  //     return null;
  //   } catch (error) {
  //     console.error("Error getting active survey instance:", error);
  //     throw error;
  //   }
  // },

  async addSurveyInstance(instance: Omit<SurveyInstance, "id">) {
    try {
      // Generate unique instance ID with counter
      const instanceId = await createUniqueInstanceId(instance.title);
      const instanceRef = doc(surveyInstancesCollection, instanceId);
      const instanceData = {
        ...instance,
        id: instanceId,
        metadata: await mergeMetadata(instance.metadata),
      };
      await setDoc(instanceRef, instanceData);
      return instanceData;
    } catch (error) {
      console.error("Error adding survey instance:", error);
      throw error;
    }
  },

  async updateSurveyInstance(id: string, data: Partial<SurveyInstance>) {
    try {
      const instanceRef = doc(db, "survey-instances", id);

      // Clean the data to remove undefined values (Firebase doesn't support them)
      const cleanData: any = { ...data };
      if (data.metadata) {
        cleanData.metadata = updateMetadata(data.metadata as any);
      } else {
        cleanData.metadata = updateMetadata(await createMetadata());
      }

      // Remove undefined values
      Object.keys(cleanData).forEach((key) => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      console.log("Updating survey instance with clean data:", cleanData);
      await updateDoc(instanceRef, cleanData);
    } catch (error) {
      console.error("Error updating survey instance:", error);
      throw error;
    }
  },

  async deleteSurveyInstance(id: string) {
    try {
      const instanceRef = doc(db, "survey-instances", id);
      await deleteDoc(instanceRef);
    } catch (error) {
      console.error("Error deleting survey instance:", error);
      throw error;
    }
  },

  // Survey Responses
  async addSurveyResponse(response: Omit<SurveyResponse, "id">) {
    try {
      console.log("addSurveyResponse called with:", response);

      // Verify the survey instance exists
      const instanceRef = doc(
        db,
        "survey-instances",
        response.surveyInstanceId
      );
      const instanceDoc = await getDoc(instanceRef);

      if (!instanceDoc.exists()) {
        throw new Error(
          `Survey instance ${response.surveyInstanceId} not found`
        );
      }

      // Use instance ID for unique collection names
      const collectionName = `survey-responses-${response.surveyInstanceId}`;

      console.log("Creating collection with name:", collectionName);

      // Create or get the instance-specific collection
      const surveyCollection = collection(firestoreDb, collectionName);

      const docRef = await addDoc(surveyCollection, {
        ...response,
        // Ensure submittedAt is set at top-level
        submittedAt: response.submittedAt || new Date().toISOString(),
        metadata: {
          ...response.metadata,
        },
      });

      console.log("✅ Survey response saved successfully:", {
        collection: collectionName,
        documentId: docRef.id,
        surveyInstanceId: response.surveyInstanceId,
        submissionTime: new Date().toISOString(),
      });
      return { id: docRef.id, ...response };
    } catch (error) {
      console.error("Error adding survey response:", error);
      throw error;
    }
  },

  // Legacy function for backward compatibility - saves to survey_responses collection
  async addSurveyResponseToLegacyCollection(
    response: Omit<SurveyResponse, "id">
  ) {
    try {
      const docRef = await addDoc(surveyResponsesCollection, {
        ...response,
        // Ensure submittedAt is set at top-level
        submittedAt: response.submittedAt || new Date().toISOString(),
        metadata: {
          ...response.metadata,
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
      // Try to order by submittedAt (new structure) with fallback to metadata.submittedAt
      let q = query(surveyResponsesCollection, orderBy("submittedAt", "desc"));
      if (instanceId) {
        q = query(
          surveyResponsesCollection,
          where("surveyInstanceId", "==", instanceId),
          orderBy("submittedAt", "desc")
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

  // Get survey responses from instance-specific collection
  async getSurveyResponsesFromCollection(instanceId: string) {
    try {
      // Verify the survey instance exists
      const instanceRef = doc(db, "survey-instances", instanceId);
      const instanceDoc = await getDoc(instanceRef);

      if (!instanceDoc.exists()) {
        throw new Error(`Survey instance ${instanceId} not found`);
      }

      // Use instance ID for unique collection names (same as storage)
      const collectionName = `survey-responses-${instanceId}`;

      // Get the instance-specific collection
      const surveyCollection = collection(firestoreDb, collectionName);

      const q = query(surveyCollection, orderBy("submittedAt", "desc"));
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
      console.error("Error getting survey responses from collection:", error);
      throw error;
    }
  },



  // Verification helper: Check instance-specific collections
  async verifyInstanceCollectionSeparation() {
    try {
      console.log("🔍 Verifying instance-specific collection separation...");

      // Get all survey instances
      const instancesSnapshot = await getDocs(
        collection(firestoreDb, "survey-instances")
      );
      const instances = instancesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SurveyInstance[];

      const verificationResults: Array<{
        instanceId: string;
        instanceTitle?: string;
        collectionName?: string;
        totalResponses?: number;
        correctInstanceResponses?: number;
        isProperlyIsolated?: boolean;
        status: string;
        error?: string;
      }> = [];

      for (const instance of instances) {
        const collectionName = `survey-responses-${instance.id}`;
        const surveyCollection = collection(firestoreDb, collectionName);

        try {
          const snapshot = await getDocs(surveyCollection);
          const responseCount = snapshot.size;

          // Verify all responses belong to this instance
          let correctInstanceId = 0;
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.surveyInstanceId === instance.id) {
              correctInstanceId++;
            }
          });

          verificationResults.push({
            instanceId: instance.id,
            instanceTitle: instance.title,
            collectionName: collectionName,
            totalResponses: responseCount,
            correctInstanceResponses: correctInstanceId,
            isProperlyIsolated: correctInstanceId === responseCount,
            status:
              correctInstanceId === responseCount
                ? "✅ ISOLATED"
                : "⚠️ MIXED DATA",
          });
        } catch (error) {
          verificationResults.push({
            instanceId: instance.id,
            collectionName: collectionName,
            error: error instanceof Error ? error.message : String(error),
            status: "❌ ERROR",
          });
        }
      }

      const summary = {
        totalInstances: instances.length,
        properlyIsolated: verificationResults.filter(
          (r) => r.isProperlyIsolated
        ).length,
        hasErrors: verificationResults.filter((r) => r.error).length,
        results: verificationResults,
      };

      console.log("🔍 Instance Collection Verification Results:", summary);
      return summary;
    } catch (error) {
      console.error("Error during verification:", error);
      throw error;
    }
  },



  // Rating Scales
  async getRatingScales() {
    try {
      const q = query(ratingOptionSetsCol, orderBy("metadata.createdAt", "desc"));
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
      const scaleRef = doc(ratingOptionSetsCol, id);
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
      // Use human-readable, kebab-case name for document ID
      const scaleId = createKebabCaseId(scale.name);
      const scaleRef = doc(ratingOptionSetsCol, scaleId);
      const scaleData = {
        ...scale,
        id: scaleId,
        // Ensure business logic fields are set
        isActive: scale.isActive ?? true,
        metadata: await mergeMetadata(scale.metadata),
      };
      await setDoc(scaleRef, scaleData);
      return scaleData;
    } catch (error) {
      console.error("Error adding rating scale:", error);
      throw error;
    }
  },

  async updateRatingScale(id: string, data: Partial<RatingScale>) {
    try {
      const scaleRef = doc(ratingOptionSetsCol, id);
      const updateData = { ...data };
      if (data.metadata) {
        updateData.metadata = updateMetadata(data.metadata as any);
      } else {
        updateData.metadata = updateMetadata(await createMetadata());
      }
      await updateDoc(scaleRef, updateData);
    } catch (error) {
      console.error("Error updating rating scale:", error);
      throw error;
    }
  },

  async deleteRatingScale(id: string) {
    try {
      const ratingScaleRef = doc(ratingOptionSetsCol, id);
      await deleteDoc(ratingScaleRef);
      console.log("Rating scale deleted successfully");
    } catch (error) {
      console.error("Error deleting rating scale:", error);
      throw error;
    }
  },

  // Multi-Select Option Sets
  async getMultiSelectOptionSets() {
    try {
      const q = query(
        multiSelectOptionSetsCol,
        orderBy("metadata.createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const optionSets = querySnapshot.docs.map((doc) => {
        const data = doc.data() as MultiSelectOptionSet;
        return { ...data, id: doc.id };
      });
      return optionSets;
    } catch (error) {
      console.error("Error getting multi-select option sets:", error);
      throw error;
    }
  },

  async getMultiSelectOptionSet(id: string) {
    try {
      const optionSetRef = doc(multiSelectOptionSetsCol, id);
      const optionSetDoc = await getDoc(optionSetRef);
      if (optionSetDoc.exists()) {
        const data = optionSetDoc.data() as MultiSelectOptionSet;
        return { ...data, id: optionSetDoc.id };
      }
      return null;
    } catch (error) {
      console.error("Error getting multi-select option set:", error);
      throw error;
    }
  },

  async addMultiSelectOptionSet(optionSet: any) {
    try {
      // Use human-readable, kebab-case name for document ID
      const setId = createKebabCaseId(optionSet.name);
      const setRef = doc(multiSelectOptionSetsCol, setId);
      const optionSetData = {
        ...optionSet,
        id: setId,
        // Ensure business logic fields are set
        isActive: optionSet.isActive ?? true,
        metadata: await mergeMetadata(optionSet.metadata),
      };
      await setDoc(setRef, optionSetData);
      console.log("Multi-select option set added with ID:", setId);
      return optionSetData;
    } catch (error) {
      console.error("Error adding multi-select option set:", error);
      throw error;
    }
  },

  async updateMultiSelectOptionSet(id: string, data: any) {
    try {
      const optionSetRef = doc(multiSelectOptionSetsCol, id);
      const updateData = { ...data };
      if (data.metadata) {
        updateData.metadata = updateMetadata(data.metadata);
      } else {
        updateData.metadata = updateMetadata(await createMetadata());
      }
      await updateDoc(optionSetRef, updateData);
      console.log("Multi-select option set updated successfully");
    } catch (error) {
      console.error("Error updating multi-select option set:", error);
      throw error;
    }
  },

  async deleteMultiSelectOptionSet(id: string) {
    console.log("Firebase deleteMultiSelectOptionSet called with ID:", id);
    try {
      const optionSetRef = doc(multiSelectOptionSetsCol, id);
      console.log("Document reference created:", optionSetRef.path);
      await deleteDoc(optionSetRef);
      console.log("Multi-select option set deleted successfully from Firebase");
    } catch (error) {
      console.error("Error deleting multi-select option set:", error);
      throw error;
    }
  },

  // Radio Option Sets
  async getRadioOptionSets() {
    try {
      const q = query(
        radioOptionSetsCol,
        orderBy("metadata.createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const optionSets = querySnapshot.docs.map((doc) => {
        const data = doc.data() as RadioOptionSet;
        return { ...data, id: doc.id };
      });
      return optionSets;
    } catch (error) {
      console.error("Error getting radio option sets:", error);
      throw error;
    }
  },

  async getRadioOptionSet(id: string) {
    try {
      const optionSetRef = doc(radioOptionSetsCol, id);
      const optionSetDoc = await getDoc(optionSetRef);
      if (optionSetDoc.exists()) {
        const data = optionSetDoc.data() as RadioOptionSet;
        return { ...data, id: optionSetDoc.id };
      }
      return null;
    } catch (error) {
      console.error("Error getting radio option set:", error);
      throw error;
    }
  },

  async addRadioOptionSet(optionSet: any) {
    try {
      // Use human-readable, kebab-case name for document ID
      const setId = createKebabCaseId(optionSet.name);
      const setRef = doc(radioOptionSetsCol, setId);
      const optionSetData = {
        ...optionSet,
        id: setId,
        // Ensure business logic fields are set
        isActive: optionSet.isActive ?? true,
        metadata: await mergeMetadata(optionSet.metadata),
      };
      await setDoc(setRef, optionSetData);
      console.log("Radio option set added with ID:", setId);
      return optionSetData;
    } catch (error) {
      console.error("Error adding radio option set:", error);
      throw error;
    }
  },

  async updateRadioOptionSet(id: string, data: any) {
    try {
      const optionSetRef = doc(radioOptionSetsCol, id);
      const updateData = { ...data };
      if (data.metadata) {
        updateData.metadata = updateMetadata(data.metadata);
      } else {
        updateData.metadata = updateMetadata(await createMetadata());
      }
      await updateDoc(optionSetRef, updateData);
      console.log("Radio option set updated successfully");
    } catch (error) {
      console.error("Error updating radio option set:", error);
      throw error;
    }
  },

  async deleteRadioOptionSet(id: string) {
    console.log("Firebase deleteRadioOptionSet called with ID:", id);
    try {
      const optionSetRef = doc(radioOptionSetsCol, id);
      console.log("Document reference created:", optionSetRef.path);
      await deleteDoc(optionSetRef);
      console.log("Radio option set deleted successfully from Firebase");
    } catch (error) {
      console.error("Error deleting radio option set:", error);
      throw error;
    }
  },

  // Select Option Sets
  async getSelectOptionSets() {
    try {
      const q = query(
        selectOptionSetsCol,
        orderBy("metadata.createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const optionSets = querySnapshot.docs.map((doc) => {
        const data = doc.data() as SelectOptionSet;
        return { ...data, id: doc.id };
      });
      return optionSets;
    } catch (error) {
      console.error("Error getting select option sets:", error);
      throw error;
    }
  },

  async getSelectOptionSet(id: string) {
    try {
      const optionSetRef = doc(selectOptionSetsCol, id);
      const optionSetDoc = await getDoc(optionSetRef);
      if (optionSetDoc.exists()) {
        const data = optionSetDoc.data() as SelectOptionSet;
        return { ...data, id: optionSetDoc.id };
      }
      return null;
    } catch (error) {
      console.error("Error getting select option set:", error);
      throw error;
    }
  },

  async addSelectOptionSet(optionSet: any) {
    try {
      // Use human-readable, kebab-case name for document ID
      const setId = createKebabCaseId(optionSet.name);
      const setRef = doc(selectOptionSetsCol, setId);
      const optionSetData = {
        ...optionSet,
        id: setId,
        // Ensure business logic fields are set
        isActive: optionSet.isActive ?? true,
        metadata: await mergeMetadata(optionSet.metadata),
      };
      await setDoc(setRef, optionSetData);
      console.log("Select option set added with ID:", setId);
      return optionSetData;
    } catch (error) {
      console.error("Error adding select option set:", error);
      throw error;
    }
  },

  async updateSelectOptionSet(id: string, data: any) {
    try {
      const optionSetRef = doc(selectOptionSetsCol, id);
      const updateData = { ...data };
      if (data.metadata) {
        updateData.metadata = updateMetadata(data.metadata);
      } else {
        updateData.metadata = updateMetadata(await createMetadata());
      }
      await updateDoc(optionSetRef, updateData);
      console.log("Select option set updated successfully");
    } catch (error) {
      console.error("Error updating select option set:", error);
      throw error;
    }
  },

  async deleteSelectOptionSet(id: string) {
    console.log("Firebase deleteSelectOptionSet called with ID:", id);
    try {
      const optionSetRef = doc(selectOptionSetsCol, id);
      console.log("Document reference created:", optionSetRef.path);
      await deleteDoc(optionSetRef);
      console.log("Select option set deleted successfully from Firebase");
    } catch (error) {
      console.error("Error deleting select option set:", error);
      throw error;
    }
  },
};

export default firebaseApp;
