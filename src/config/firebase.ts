import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

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

// Initialize Firebase (singleton)
function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp);
    surveysCol = collection(firestoreDb, "surveys");

    // Disable real-time listeners to prevent connection spam
    // We only need one-time reads and writes
    console.log("Firebase initialized with real-time listeners disabled");
  }
  return { app: firebaseApp, db: firestoreDb, surveysCollection: surveysCol };
}

// Get Firebase instances
const { db: firestoreInstance, surveysCollection: surveysCollectionInstance } =
  initializeFirebase();

export const db = firestoreInstance;
export const surveysCollection = surveysCollectionInstance;

// Firestore helper functions
export const firestoreHelpers = {
  // Get all surveys
  async getSurveys() {
    try {
      console.log("Fetching surveys from Firebase...");
      const q = query(surveysCollection, orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const surveys = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      console.log(`Fetched ${surveys.length} surveys from Firebase`);
      return surveys;
    } catch (error) {
      console.error("Error getting surveys:", error);
      throw error;
    }
  },

  // Add a new survey
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

  // Update a survey
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

  // Delete a survey
  async deleteSurvey(id: string) {
    try {
      const surveyRef = doc(db, "surveys", id);
      await deleteDoc(surveyRef);
    } catch (error) {
      console.error("Error deleting survey:", error);
      throw error;
    }
  },
};

export default firebaseApp;
