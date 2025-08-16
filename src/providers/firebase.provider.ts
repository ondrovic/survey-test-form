import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
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
} from 'firebase/firestore';

import {
  DatabaseConfig,
  DatabaseProvider_Interface,
  AuthHelpers,
  DatabaseHelpers,
} from '../types/database.types';
import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
  SurveyConfig,
  SurveyInstance,
  SurveyResponse,
} from '../types/framework.types';
import {
  createMetadata,
  mergeMetadata,
  updateMetadata,
} from '../utils/metadata.utils';

export class FirebaseProvider implements DatabaseProvider_Interface {
  private firebaseApp: any = null;
  private firestoreDb: any = null;
  private authInstance: any = null;
  private initialized = false;

  // Collections
  private surveysCol: any = null;
  private surveyConfigsCol: any = null;
  private surveyInstancesCol: any = null;
  private surveyResponsesCol: any = null;
  private ratingOptionSetsCol: any = null;
  private radioOptionSetsCol: any = null;
  private multiSelectOptionSetsCol: any = null;
  private selectOptionSetsCol: any = null;

  async initialize(config: DatabaseConfig): Promise<void> {
    if (!config.firebase) {
      throw new Error('Firebase configuration is required');
    }

    this.firebaseApp = initializeApp(config.firebase);
    this.firestoreDb = getFirestore(this.firebaseApp);
    this.authInstance = getAuth(this.firebaseApp);

    // Initialize collections
    this.surveysCol = collection(this.firestoreDb, 'surveys');
    this.surveyConfigsCol = collection(this.firestoreDb, 'survey-configs');
    this.surveyInstancesCol = collection(this.firestoreDb, 'survey-instances');
    this.surveyResponsesCol = collection(this.firestoreDb, 'survey-responses');
    this.ratingOptionSetsCol = collection(this.firestoreDb, 'rating-option-sets');
    this.radioOptionSetsCol = collection(this.firestoreDb, 'radio-option-sets');
    this.multiSelectOptionSetsCol = collection(this.firestoreDb, 'multi-select-option-sets');
    this.selectOptionSetsCol = collection(this.firestoreDb, 'select-option-sets');

    this.initialized = true;
    console.log('Firebase provider initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  get authHelpers(): AuthHelpers {
    const authInstance = this.authInstance;
    return {
      async signInAnonymously() {
        try {
          const userCredential = await signInAnonymously(authInstance);
          return userCredential.user;
        } catch (error) {
          console.error('Error signing in anonymously:', error);
          throw error;
        }
      },

      getCurrentUser: () => {
        return authInstance.currentUser;
      },

      onAuthStateChanged: (callback: (user: any) => void) => {
        return onAuthStateChanged(authInstance, callback);
      },
    };
  }

  get databaseHelpers(): DatabaseHelpers {
    const surveysCol = this.surveysCol;
    const surveyConfigsCol = this.surveyConfigsCol;
    const surveyInstancesCol = this.surveyInstancesCol;
    const surveyResponsesCol = this.surveyResponsesCol;
    const ratingOptionSetsCol = this.ratingOptionSetsCol;
    const radioOptionSetsCol = this.radioOptionSetsCol;
    const multiSelectOptionSetsCol = this.multiSelectOptionSetsCol;
    const selectOptionSetsCol = this.selectOptionSetsCol;
    const firestoreDb = this.firestoreDb;
    const createKebabCaseId = this.createKebabCaseId.bind(this);
    const createUniqueInstanceId = this.createUniqueInstanceId.bind(this);
    
    return {
      // Legacy survey functions
      async getSurveys() {
        try {
          const q = query(surveysCol, orderBy('submittedAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const surveys = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          }));
          return surveys;
        } catch (error) {
          console.error('Error getting surveys:', error);
          throw error;
        }
      },

      async addSurvey(surveyData: any) {
        try {
          console.log('Adding survey to Firebase...');
          const docRef = await addDoc(surveysCol, {
            ...surveyData,
            submittedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
          console.log('Survey added successfully to Firebase');
          return { id: docRef.id, ...surveyData };
        } catch (error) {
          console.error('Error adding survey:', error);
          throw error;
        }
      },

      async updateSurvey(id: string, data: any) {
        try {
          const surveyRef = doc(firestoreDb, 'surveys', id);
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }
          await updateDoc(surveyRef, updateData);
        } catch (error) {
          console.error('Error updating survey:', error);
          throw error;
        }
      },

      async deleteSurvey(id: string) {
        try {
          const surveyRef = doc(firestoreDb, 'surveys', id);
          await deleteDoc(surveyRef);
        } catch (error) {
          console.error('Error deleting survey:', error);
          throw error;
        }
      },

      // Survey Configs
      async getSurveyConfigs() {
        try {
          const q = query(surveyConfigsCol, orderBy('metadata.createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const configs = querySnapshot.docs.map((doc) => {
            const data = doc.data() as SurveyConfig;
            return {
              ...data,
              id: doc.id,
            };
          });
          return configs;
        } catch (error) {
          console.error('Error getting survey configs:', error);
          throw error;
        }
      },

      async getSurveyConfig(id: string) {
        try {
          const configRef = doc(firestoreDb, 'survey-configs', id);
          const configDoc = await getDoc(configRef);
          if (configDoc.exists()) {
            const data = configDoc.data();
            const configData = data as SurveyConfig;
            return { ...configData, id: configDoc.id };
          }
          return null;
        } catch (error) {
          console.error('Error getting survey config:', error);
          throw error;
        }
      },

      async addSurveyConfig(config: Omit<SurveyConfig, 'id'>) {
        try {
          const configId = createKebabCaseId(config.title);
          const configRef = doc(firestoreDb, 'survey-configs', configId);
          const configData = {
            ...config,
            id: configId,
            isActive: config.isActive ?? true,
            version: config.version || '1.0.0',
            metadata: await mergeMetadata(config.metadata),
          };
          await setDoc(configRef, configData);
          return configData;
        } catch (error) {
          console.error('Error adding survey config:', error);
          throw error;
        }
      },

      async updateSurveyConfig(id: string, data: Partial<SurveyConfig>) {
        try {
          const configRef = doc(firestoreDb, 'survey-configs', id);
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }
          await updateDoc(configRef, updateData);
        } catch (error) {
          console.error('Error updating survey config:', error);
          throw error;
        }
      },

      async deleteSurveyConfig(id: string) {
        try {
          const configRef = doc(firestoreDb, 'survey-configs', id);
          await deleteDoc(configRef);
        } catch (error) {
          console.error('Error deleting survey config:', error);
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
          console.error('Error getting survey instances:', error);
          throw error;
        }
      },

      async getSurveyInstancesByConfig(configId: string) {
        try {
          const q = query(surveyInstancesCol, where('configId', '==', configId));
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
          console.error('Error getting survey instances by config:', error);
          throw error;
        }
      },

      async addSurveyInstance(instance: Omit<SurveyInstance, 'id'>) {
        try {
          const instanceId = await createUniqueInstanceId(instance.title);
          const instanceRef = doc(surveyInstancesCol, instanceId);
          const instanceData = {
            ...instance,
            id: instanceId,
            metadata: await mergeMetadata(instance.metadata),
          };
          await setDoc(instanceRef, instanceData);
          return instanceData;
        } catch (error) {
          console.error('Error adding survey instance:', error);
          throw error;
        }
      },

      async updateSurveyInstance(id: string, data: Partial<SurveyInstance>) {
        try {
          const instanceRef = doc(firestoreDb, 'survey-instances', id);
          const cleanData: any = { ...data };
          if (data.metadata) {
            cleanData.metadata = updateMetadata(data.metadata as any);
          } else {
            cleanData.metadata = updateMetadata(await createMetadata());
          }

          Object.keys(cleanData).forEach((key) => {
            if (cleanData[key] === undefined) {
              delete cleanData[key];
            }
          });

          await updateDoc(instanceRef, cleanData);
        } catch (error) {
          console.error('Error updating survey instance:', error);
          throw error;
        }
      },

      async deleteSurveyInstance(id: string) {
        try {
          const instanceRef = doc(firestoreDb, 'survey-instances', id);
          await deleteDoc(instanceRef);
        } catch (error) {
          console.error('Error deleting survey instance:', error);
          throw error;
        }
      },

      // Survey Responses
      async addSurveyResponse(response: Omit<SurveyResponse, 'id'>) {
        try {
          const instanceRef = doc(firestoreDb, 'survey-instances', response.surveyInstanceId);
          const instanceDoc = await getDoc(instanceRef);

          if (!instanceDoc.exists()) {
            throw new Error(`Survey instance ${response.surveyInstanceId} not found`);
          }

          const collectionName = `survey-responses-${response.surveyInstanceId}`;
          const surveyCollection = collection(firestoreDb, collectionName);

          const docRef = await addDoc(surveyCollection, {
            ...response,
            submittedAt: response.submittedAt || new Date().toISOString(),
            metadata: {
              ...response.metadata,
            },
          });

          return { id: docRef.id, ...response };
        } catch (error) {
          console.error('Error adding survey response:', error);
          throw error;
        }
      },

      async getSurveyResponses(instanceId?: string) {
        try {
          let q = query(surveyResponsesCol, orderBy('submittedAt', 'desc'));
          if (instanceId) {
            q = query(
              surveyResponsesCol,
              where('surveyInstanceId', '==', instanceId),
              orderBy('submittedAt', 'desc')
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
          console.error('Error getting survey responses:', error);
          throw error;
        }
      },

      async getSurveyResponsesFromCollection(instanceId: string) {
        try {
          const instanceRef = doc(firestoreDb, 'survey-instances', instanceId);
          const instanceDoc = await getDoc(instanceRef);

          if (!instanceDoc.exists()) {
            throw new Error(`Survey instance ${instanceId} not found`);
          }

          const collectionName = `survey-responses-${instanceId}`;
          const surveyCollection = collection(firestoreDb, collectionName);

          const q = query(surveyCollection, orderBy('submittedAt', 'desc'));
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
          console.error('Error getting survey responses from collection:', error);
          throw error;
        }
      },

      // Rating Scales
      async getRatingScales() {
        try {
          const q = query(ratingOptionSetsCol, orderBy('metadata.createdAt', 'desc'));
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
          console.error('Error getting rating scales:', error);
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
          console.error('Error getting rating scale:', error);
          throw error;
        }
      },

      async addRatingScale(scale: Omit<RatingScale, 'id'>) {
        try {
          const scaleId = createKebabCaseId(scale.name);
          const scaleRef = doc(ratingOptionSetsCol, scaleId);
          const scaleData = {
            ...scale,
            id: scaleId,
            isActive: scale.isActive ?? true,
            metadata: await mergeMetadata(scale.metadata),
          };
          await setDoc(scaleRef, scaleData);
          return scaleData;
        } catch (error) {
          console.error('Error adding rating scale:', error);
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
          console.error('Error updating rating scale:', error);
          throw error;
        }
      },

      async deleteRatingScale(id: string) {
        try {
          const ratingScaleRef = doc(ratingOptionSetsCol, id);
          await deleteDoc(ratingScaleRef);
        } catch (error) {
          console.error('Error deleting rating scale:', error);
          throw error;
        }
      },

      // Radio Option Sets
      async getRadioOptionSets() {
        try {
          const q = query(radioOptionSetsCol, orderBy('metadata.createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const optionSets = querySnapshot.docs.map((doc) => {
            const data = doc.data() as RadioOptionSet;
            return { ...data, id: doc.id };
          });
          return optionSets;
        } catch (error) {
          console.error('Error getting radio option sets:', error);
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
          console.error('Error getting radio option set:', error);
          throw error;
        }
      },

      async addRadioOptionSet(optionSet: Omit<RadioOptionSet, 'id'>) {
        try {
          const setId = createKebabCaseId(optionSet.name);
          const setRef = doc(radioOptionSetsCol, setId);
          const optionSetData = {
            ...optionSet,
            id: setId,
            isActive: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };
          await setDoc(setRef, optionSetData);
          return optionSetData;
        } catch (error) {
          console.error('Error adding radio option set:', error);
          throw error;
        }
      },

      async updateRadioOptionSet(id: string, data: Partial<RadioOptionSet>) {
        try {
          const optionSetRef = doc(radioOptionSetsCol, id);
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }
          await updateDoc(optionSetRef, updateData);
        } catch (error) {
          console.error('Error updating radio option set:', error);
          throw error;
        }
      },

      async deleteRadioOptionSet(id: string) {
        try {
          const optionSetRef = doc(radioOptionSetsCol, id);
          await deleteDoc(optionSetRef);
        } catch (error) {
          console.error('Error deleting radio option set:', error);
          throw error;
        }
      },

      // Multi-Select Option Sets
      async getMultiSelectOptionSets() {
        try {
          const q = query(multiSelectOptionSetsCol, orderBy('metadata.createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const optionSets = querySnapshot.docs.map((doc) => {
            const data = doc.data() as MultiSelectOptionSet;
            return { ...data, id: doc.id };
          });
          return optionSets;
        } catch (error) {
          console.error('Error getting multi-select option sets:', error);
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
          console.error('Error getting multi-select option set:', error);
          throw error;
        }
      },

      async addMultiSelectOptionSet(optionSet: Omit<MultiSelectOptionSet, 'id'>) {
        try {
          const setId = createKebabCaseId(optionSet.name);
          const setRef = doc(multiSelectOptionSetsCol, setId);
          const optionSetData = {
            ...optionSet,
            id: setId,
            isActive: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };
          await setDoc(setRef, optionSetData);
          return optionSetData;
        } catch (error) {
          console.error('Error adding multi-select option set:', error);
          throw error;
        }
      },

      async updateMultiSelectOptionSet(id: string, data: Partial<MultiSelectOptionSet>) {
        try {
          const optionSetRef = doc(multiSelectOptionSetsCol, id);
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }
          await updateDoc(optionSetRef, updateData);
        } catch (error) {
          console.error('Error updating multi-select option set:', error);
          throw error;
        }
      },

      async deleteMultiSelectOptionSet(id: string) {
        try {
          const optionSetRef = doc(multiSelectOptionSetsCol, id);
          await deleteDoc(optionSetRef);
        } catch (error) {
          console.error('Error deleting multi-select option set:', error);
          throw error;
        }
      },

      // Select Option Sets
      async getSelectOptionSets() {
        try {
          const q = query(selectOptionSetsCol, orderBy('metadata.createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const optionSets = querySnapshot.docs.map((doc) => {
            const data = doc.data() as SelectOptionSet;
            return { ...data, id: doc.id };
          });
          return optionSets;
        } catch (error) {
          console.error('Error getting select option sets:', error);
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
          console.error('Error getting select option set:', error);
          throw error;
        }
      },

      async addSelectOptionSet(optionSet: Omit<SelectOptionSet, 'id'>) {
        try {
          const setId = createKebabCaseId(optionSet.name);
          const setRef = doc(selectOptionSetsCol, setId);
          const optionSetData = {
            ...optionSet,
            id: setId,
            isActive: optionSet.isActive ?? true,
            metadata: await mergeMetadata(optionSet.metadata),
          };
          await setDoc(setRef, optionSetData);
          return optionSetData;
        } catch (error) {
          console.error('Error adding select option set:', error);
          throw error;
        }
      },

      async updateSelectOptionSet(id: string, data: Partial<SelectOptionSet>) {
        try {
          const optionSetRef = doc(selectOptionSetsCol, id);
          const updateData = { ...data };
          if (data.metadata) {
            updateData.metadata = updateMetadata(data.metadata as any);
          } else {
            updateData.metadata = updateMetadata(await createMetadata());
          }
          await updateDoc(optionSetRef, updateData);
        } catch (error) {
          console.error('Error updating select option set:', error);
          throw error;
        }
      },

      async deleteSelectOptionSet(id: string) {
        try {
          const optionSetRef = doc(selectOptionSetsCol, id);
          await deleteDoc(optionSetRef);
        } catch (error) {
          console.error('Error deleting select option set:', error);
          throw error;
        }
      },
    };
  }

  private createKebabCaseId(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async createUniqueInstanceId(baseTitle: string): Promise<string> {
    const baseId = this.createKebabCaseId(baseTitle);

    const q = query(this.surveyInstancesCol);
    const querySnapshot = await getDocs(q);
    const existingIds = querySnapshot.docs.map((doc) => doc.id);

    const matchingIds = existingIds.filter((id) => id.startsWith(baseId));

    if (matchingIds.length === 0) {
      return `${baseId}-001`;
    }

    const counters = matchingIds
      .map((id) => {
        const match = id.match(new RegExp(`^${baseId}-(\\d{3})$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((counter) => counter > 0);

    const nextCounter = counters.length > 0 ? Math.max(...counters) + 1 : 1;
    return `${baseId}-${nextCounter.toString().padStart(3, '0')}`;
  }
}