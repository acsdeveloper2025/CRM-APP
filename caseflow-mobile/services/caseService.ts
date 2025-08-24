import { Case, CaseStatus, VerificationType, Attachment, VerificationOutcome } from '../types';
import AsyncStorage from '../polyfills/AsyncStorage';
import { migrateCasesVerificationOutcomes, isDeprecatedOutcome } from '../utils/verificationOutcomeMigration';
import { apiClient } from './apiClient';
import { getEnvironmentConfig } from '../config/environment';

const LOCAL_STORAGE_KEY = 'caseflowCases';

// API interfaces
export interface CaseListParams {
  page?: number;
  limit?: number;
  status?: CaseStatus;
  verificationType?: VerificationType;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  assignedToMe?: boolean;
}

export interface CaseUpdateRequest {
  status?: CaseStatus;
  priority?: number;
  verificationOutcome?: string;
  notes?: string;
  assignedTo?: string;
}

export interface CaseListResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CaseDetailResponse {
  case: Case;
  history: Array<{
    id: string;
    action: string;
    timestamp: string;
    userId: string;
    userName: string;
    details?: any;
  }>;
}

// Helper function to generate realistic attachments
// Mock attachment generation function removed

// Mock case data generation function removed - app now uses only real API data

class CaseService {
  private config = getEnvironmentConfig();
  private useOfflineMode = false;
  private lastSyncTimestamp: string | null = null;
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeData();
    this.useOfflineMode = this.config.features.enableOfflineMode;
    this.initializeHybridSync();
  }

  /**
   * Initialize hybrid sync strategy
   */
  private async initializeHybridSync(): Promise<void> {
    // Load last sync timestamp
    this.lastSyncTimestamp = await AsyncStorage.getItem('lastSyncTimestamp');

    // Set up periodic sync as fallback
    if (this.config.features.enableBackgroundSync) {
      this.setupPeriodicSync();
    }
  }

  /**
   * Set up periodic sync as fallback for WebSocket notifications
   */
  private setupPeriodicSync(): void {
    const syncInterval = this.config.offline.autoSyncInterval || 300000; // 5 minutes default

    this.syncInterval = setInterval(async () => {
      if (!this.syncInProgress && navigator.onLine) {
        await this.syncCases();
      }
    }, syncInterval);
  }

  /**
   * Clean up sync resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async initializeData() {
    const existingData = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    if (!existingData) {
      // Initialize with empty array - no mock data
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    }
  }

  private async readFromStorage(): Promise<Case[]> {
    const data = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async writeToStorage(cases: Case[]): Promise<void> {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cases));
  }

  async getCases(params: CaseListParams = {}): Promise<CaseListResponse> {
    try {
      
      // If offline mode is enabled or no network, use local data
      if (this.useOfflineMode || !navigator.onLine) {
        const localCases = await this.getLocalCases();
        return this.filterAndPaginateLocalCases(localCases, params);
      }

      // Try to fetch from API
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.verificationType) queryParams.append('verificationType', params.verificationType);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.assignedToMe) queryParams.append('assignedToMe', 'true');

      const apiUrl = `/mobile/cases?${queryParams.toString()}`;
      
      const response = await apiClient.get<CaseListResponse>(apiUrl);

      if (response.success && response.data) {
        
        // Cache the cases locally for offline access
        await this.cacheApiCases(response.data.cases);

        // Transform mobile cases to Case interface for return
        const transformedCases = response.data.cases.map(mobileCase => this.transformMobileCaseToCase(mobileCase));
        
        return {
          cases: transformedCases,
          pagination: response.data.pagination,
        };
      } else {
        // Fallback to local data if API fails
        const localCases = await this.getLocalCases();
        return this.filterAndPaginateLocalCases(localCases, params);
      }
    } catch (error) {
      // Fallback to local data
      const localCases = await this.getLocalCases();
      return this.filterAndPaginateLocalCases(localCases, params);
    }
  }

  private async getLocalCases(): Promise<Case[]> {
    const cases = await this.readFromStorage();
    // Apply verification outcome migration for any deprecated outcomes
    const migratedCases = migrateCasesVerificationOutcomes(cases);

    // If any cases were migrated, save the updated data
    const hasMigrations = migratedCases.some((migratedCase, index) =>
      migratedCase.verificationOutcome !== cases[index].verificationOutcome
    );

    if (hasMigrations) {
      await this.writeToStorage(migratedCases);
    }

    return migratedCases;
  }

  private filterAndPaginateLocalCases(cases: Case[], params: CaseListParams): CaseListResponse {
    let filteredCases = [...cases];

    // Apply filters
    if (params.status) {
      filteredCases = filteredCases.filter(c => c.status === params.status);
    }
    if (params.verificationType) {
      filteredCases = filteredCases.filter(c => c.verificationType === params.verificationType);
    }
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredCases = filteredCases.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.customer.name.toLowerCase().includes(searchLower) ||
        c.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (params.sortBy) {
      filteredCases.sort((a, b) => {
        const aValue = a[params.sortBy!];
        const bValue = b[params.sortBy!];
        const order = params.sortOrder === 'desc' ? -1 : 1;

        if (aValue < bValue) return -1 * order;
        if (aValue > bValue) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCases = filteredCases.slice(startIndex, endIndex);

    return {
      cases: paginatedCases,
      pagination: {
        page,
        limit,
        total: filteredCases.length,
        totalPages: Math.ceil(filteredCases.length / limit),
      },
    };
  }

  private transformMobileCaseToCase(mobileCase: any): Case {
    
    // Handle verification type - keep original value if it's valid
    let verificationType = mobileCase.verificationType || 'Residence';
    
    // Ensure status matches CaseStatus enum values exactly
    let status: CaseStatus;
    switch (mobileCase.status?.toUpperCase()) {
      case 'ASSIGNED':
        status = CaseStatus.Assigned;
        break;
      case 'IN_PROGRESS':
        status = CaseStatus.InProgress;
        break;
      case 'COMPLETED':
        status = CaseStatus.Completed;
        break;
      case 'PENDING':
        status = CaseStatus.Pending;
        break;
      default:
        status = CaseStatus.Assigned; // Default to Assigned if unknown
        break;
    }
    
    // Convert priority from string to number
    let priority: number | undefined;
    switch (mobileCase.priority?.toUpperCase()) {
      case 'HIGH':
        priority = 3;
        break;
      case 'MEDIUM':
        priority = 2;
        break;
      case 'LOW':
        priority = 1;
        break;
      default:
        priority = undefined;
        break;
    }
    
    const transformedCase = {
      id: mobileCase.id,
      caseId: mobileCase.caseId?.toString(),
      title: mobileCase.title || `Case ${mobileCase.caseId || mobileCase.id}`,
      description: mobileCase.description || '',
      customer: {
        name: mobileCase.customerName || mobileCase.customer?.name || '',
        contact: mobileCase.customerPhone || mobileCase.customer?.contact || '',
      },
      status: status,
      isSaved: false,
      createdAt: mobileCase.assignedAt || new Date().toISOString(),
      updatedAt: mobileCase.updatedAt || new Date().toISOString(),
      completedAt: mobileCase.completedAt,
      priority: priority,
      verificationType: verificationType as VerificationType,
      verificationOutcome: mobileCase.verificationOutcome as VerificationOutcome | null,
      // Assignment fields
      clientName: mobileCase.client?.name,
      applicantType: mobileCase.applicantType,
      createdByBackendUser: mobileCase.createdByBackendUser,
      backendContactNumber: mobileCase.backendContactNumber,
      assignedToFieldUser: mobileCase.assignedToFieldUser,
      trigger: mobileCase.notes,
      customerCallingCode: mobileCase.customerCallingCode,
      // Legacy fields
      product: mobileCase.product?.name,
      bankName: mobileCase.client?.name, // Use client name as bank name for now
      visitAddress: `${mobileCase.addressStreet || ''}, ${mobileCase.addressCity || ''}, ${mobileCase.addressState || ''} ${mobileCase.addressPincode || ''}`.trim(),
      systemContactNumber: mobileCase.backendContactNumber,
      applicantStatus: mobileCase.applicantType,
      attachments: mobileCase.attachments || [],
    };
    
    return transformedCase;
  }

  private async cacheApiCases(mobileCases: any[]): Promise<void> {
    try {
      // Transform mobile cases to Case interface
      const cases = mobileCases.map(mobileCase => this.transformMobileCaseToCase(mobileCase));

      // Merge with existing local cases, preferring API data
      const localCases = await this.readFromStorage();
      const mergedCases = [...cases];

      // Add any local-only cases that aren't in the API response
      localCases.forEach(localCase => {
        if (!cases.find(apiCase => apiCase.id === localCase.id)) {
          mergedCases.push(localCase);
        }
      });

      await this.writeToStorage(mergedCases);
    } catch (error) {
      console.error('Error caching API cases:', error);
    }
  }

  private async markForSync(caseId: string, action: 'create' | 'update' | 'delete', data?: any): Promise<void> {
    try {
      const syncQueue = await AsyncStorage.getItem('syncQueue') || '[]';
      const queue = JSON.parse(syncQueue);

      const syncItem = {
        id: `${action}_${caseId}_${Date.now()}`,
        caseId,
        action,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(syncItem);
      await AsyncStorage.setItem('syncQueue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error marking for sync:', error);
    }
  }

  async getCase(id: string): Promise<Case | undefined> {
    try {
      // Try to fetch from API first
      if (!this.useOfflineMode && navigator.onLine) {
        const response = await apiClient.get<CaseDetailResponse>(`/mobile/cases/${id}`);

        if (response.success && response.data) {
          // Cache the case locally
          await this.updateLocalCase(response.data.case);
          return response.data.case;
        }
      }

      // Fallback to local data
      const cases = await this.readFromStorage();
      return cases.find(c => c.id === id);
    } catch (error) {
      console.error('Error fetching case by ID:', error);
      // Fallback to local data
      const cases = await this.readFromStorage();
      return cases.find(c => c.id === id);
    }
  }

  private async updateLocalCase(updatedCase: Case): Promise<void> {
    try {
      const cases = await this.readFromStorage();
      const index = cases.findIndex(c => c.id === updatedCase.id);

      if (index >= 0) {
        cases[index] = updatedCase;
      } else {
        cases.push(updatedCase);
      }

      await this.writeToStorage(cases);
    } catch (error) {
      console.error('Error updating local case:', error);
    }
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    try {
      // Prepare API update request
      const apiUpdates: CaseUpdateRequest = {};
      if (updates.status) apiUpdates.status = updates.status;
      if (updates.priority) apiUpdates.priority = updates.priority;
      if (updates.verificationOutcome) apiUpdates.verificationOutcome = updates.verificationOutcome.toString();
      if (updates.notes) apiUpdates.notes = updates.notes;

      // Try to update via API first
      if (!this.useOfflineMode && navigator.onLine) {
        const response = await apiClient.put<{ case: Case }>(`/mobile/cases/${id}`, apiUpdates);

        if (response.success && response.data) {
          // Update local cache
          await this.updateLocalCase(response.data.case);
          return response.data.case;
        }
      }

      // Fallback to local update
      const cases = await this.readFromStorage();
      const caseIndex = cases.findIndex(c => c.id === id);
      if (caseIndex === -1) {
        throw new Error('Case not found');
      }
      const updatedCase = { ...cases[caseIndex], ...updates, updatedAt: new Date().toISOString() };
      cases[caseIndex] = updatedCase;
      await this.writeToStorage(cases);

      // Mark for sync if offline
      if (this.useOfflineMode || !navigator.onLine) {
        await this.markForSync(id, 'update', updates);
      }

      return updatedCase;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  }
  
  async revokeCase(id: string, reason: string): Promise<void> {
    const cases = await this.readFromStorage();
    const updatedCases = cases.filter(c => c.id !== id);
    await this.writeToStorage(updatedCases);
  }

  async syncWithServer(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {

    try {
      if (!navigator.onLine) {
        return { success: false, syncedCount: 0, errors: ['No internet connection'] };
      }

      const syncQueue = await AsyncStorage.getItem('syncQueue') || '[]';
      const queue = JSON.parse(syncQueue);

      if (queue.length === 0) {
        return { success: true, syncedCount: 0, errors: [] };
      }

      let syncedCount = 0;
      const errors: string[] = [];
      const remainingQueue = [];

      for (const item of queue) {
        try {
          let success = false;

          switch (item.action) {
            case 'update':
              const updateResponse = await apiClient.put(`/mobile/cases/${item.caseId}`, item.data);
              success = updateResponse.success;
              break;
            case 'create':
              const createResponse = await apiClient.post('/mobile/cases', item.data);
              success = createResponse.success;
              break;
            case 'delete':
              const deleteResponse = await apiClient.delete(`/mobile/cases/${item.caseId}`);
              success = deleteResponse.success;
              break;
          }

          if (success) {
            syncedCount++;
          } else {
            item.retryCount = (item.retryCount || 0) + 1;
            if (item.retryCount < this.config.offline.syncRetryAttempts) {
              remainingQueue.push(item);
            } else {
              errors.push(`Failed to sync ${item.action} for case ${item.caseId} after ${item.retryCount} attempts`);
            }
          }
        } catch (error) {
          item.retryCount = (item.retryCount || 0) + 1;
          if (item.retryCount < this.config.offline.syncRetryAttempts) {
            remainingQueue.push(item);
          } else {
            errors.push(`Error syncing ${item.action} for case ${item.caseId}: ${error}`);
          }
        }
      }

      // Update sync queue with remaining items
      await AsyncStorage.setItem('syncQueue', JSON.stringify(remainingQueue));

      // Refresh local data from server
      if (syncedCount > 0) {
        await this.getCases({ page: 1, limit: 50 }); // Refresh first page
      }

      return { success: errors.length === 0, syncedCount, errors };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, syncedCount: 0, errors: [error.toString()] };
    }
  }

  async submitCase(id: string): Promise<{ success: boolean; error?: string }> {

    try {
      // Update case status to submitting
      await this.updateCase(id, {
        submissionStatus: 'submitting',
        lastSubmissionAttempt: new Date().toISOString()
      });

      // Get the case data to submit
      const caseData = await this.getCase(id);
      if (!caseData) {
        throw new Error('Case not found');
      }

      // Submit to API
      const response = await apiClient.post(`/mobile/cases/${id}/submit`, {
        caseData,
        timestamp: new Date().toISOString(),
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Submission failed');
      }

      // Mark as successfully submitted
      await this.updateCase(id, {
        submissionStatus: 'success',
        submissionError: undefined,
        isSaved: false, // Clear saved status since it's now submitted
        status: CaseStatus.Completed,
      });


      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Mark as failed submission
      await this.updateCase(id, {
        submissionStatus: 'failed',
        submissionError: errorMessage
      });

      // If offline, mark for sync
      if (!navigator.onLine) {
        await this.markForSync(id, 'update', { status: CaseStatus.Completed });
      }

      console.error(`Case ${id} submission failed:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async resubmitCase(id: string): Promise<{ success: boolean; error?: string }> {
    return this.submitCase(id);
  }

  /**
   * Intelligent sync method that combines real-time and periodic sync
   */
  async syncCases(): Promise<{ success: boolean; newCases: number; updatedCases: number; error?: string }> {
    if (this.syncInProgress) {
      return { success: false, newCases: 0, updatedCases: 0, error: 'Sync already in progress' };
    }

    if (!navigator.onLine) {
      return { success: false, newCases: 0, updatedCases: 0, error: 'Device is offline' };
    }

    this.syncInProgress = true;
    let newCases = 0;
    let updatedCases = 0;

    try {

      // Get current local cases
      const localCases = await this.getLocalCases();
      const localCaseIds = new Set(localCases.map(c => c.id));

      // Prepare sync parameters
      const syncParams = new URLSearchParams();
      if (this.lastSyncTimestamp) {
        syncParams.append('lastSyncTimestamp', this.lastSyncTimestamp);
      }
      syncParams.append('limit', '100'); // Batch size for sync

      // Fetch updated cases from server using correct sync endpoint
      const response = await apiClient.get<CaseListResponse>(`/mobile/sync/download?${syncParams.toString()}`);

      if (response.success && response.data) {
        const serverCases = response.data.cases;

        for (const serverCase of serverCases) {
          const transformedCase = this.transformMobileCaseToCase(serverCase);

          if (localCaseIds.has(transformedCase.id)) {
            // Update existing case
            await this.updateLocalCase(transformedCase);
            updatedCases++;
          } else {
            // Add new case
            await this.addLocalCase(transformedCase);
            newCases++;
          }
        }

        // Update sync timestamp
        this.lastSyncTimestamp = new Date().toISOString();
        await AsyncStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp);

        // console.log(`✅ Sync completed: ${newCases} new cases, ${updatedCases} updated cases`);
        return { success: true, newCases, updatedCases };
      } else {
        throw new Error(response.error?.message || 'Sync failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      // console.error('❌ Sync failed:', errorMessage);
      return { success: false, newCases, updatedCases, error: errorMessage };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Add a new case to local storage
   */
  private async addLocalCase(newCase: Case): Promise<void> {
    const cases = await this.readFromStorage();
    cases.push(newCase);
    await this.writeToStorage(cases);
  }



  /**
   * Force sync - useful when triggered by WebSocket notifications
   */
  async forceSyncCases(): Promise<{ success: boolean; newCases: number; updatedCases: number; error?: string }> {
    // console.log('🚀 Force sync triggered (likely from WebSocket notification)');
    return this.syncCases();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { inProgress: boolean; lastSync: string | null } {
    return {
      inProgress: this.syncInProgress,
      lastSync: this.lastSyncTimestamp,
    };
  }
}

export const caseService = new CaseService();
