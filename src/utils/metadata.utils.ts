import { getClientIPAddressWithTimeout } from './ip.utils';

interface BaseMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  ip?: string;
}

interface CreateMetadataOptions extends Partial<Pick<BaseMetadata, 'createdBy' | 'ip'>> {
  // Create-specific options can be added here in the future
}

interface UpdateMetadataOptions extends Partial<Pick<BaseMetadata, 'createdBy' | 'ip'>> {
  // For semantic clarity, we can also accept updatedBy as an alias
  updatedBy?: string;
}

export const createMetadata = async (options: CreateMetadataOptions = {}): Promise<BaseMetadata> => {
  const now = new Date().toISOString();
  
  // Get real IP address if not provided
  let ipAddress = options.ip;
  if (!ipAddress) {
    const clientIP = await getClientIPAddressWithTimeout(3000);
    ipAddress = clientIP || '127.0.0.1'; // Fallback to localhost
  }
  
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: options.createdBy ?? 'admin',
    ip: ipAddress
  };
};

export const updateMetadata = (existingMetadata: BaseMetadata, options: UpdateMetadataOptions = {}): BaseMetadata => {
  return {
    ...existingMetadata,
    updatedAt: new Date().toISOString(),
    // Handle both updatedBy (alias) and createdBy, with updatedBy taking precedence
    ...(options.updatedBy && { createdBy: options.updatedBy }),
    ...(options.createdBy && !options.updatedBy && { createdBy: options.createdBy }),
    ...(options.ip && { ip: options.ip })
  };
};

export const mergeMetadata = async (existingMetadata: Partial<BaseMetadata> = {}, options: CreateMetadataOptions = {}): Promise<BaseMetadata> => {
  const now = new Date().toISOString();
  
  // Get real IP address if not provided in existing metadata or options
  // Also fetch real IP if existing metadata has the default localhost IP
  let ipAddress = existingMetadata.ip || options.ip;
  if (!ipAddress || ipAddress === '127.0.0.1') {
    const clientIP = await getClientIPAddressWithTimeout(3000);
    ipAddress = clientIP || '127.0.0.1'; // Fallback to localhost
  }
  
  return {
    createdAt: existingMetadata.createdAt || now,
    updatedAt: now,
    createdBy: existingMetadata.createdBy ?? options.createdBy ?? 'admin',
    ip: ipAddress
  };
};

// Synchronous version for default values - IP will be updated when saved
export const createMetadataSync = (options: CreateMetadataOptions = {}): BaseMetadata => {
  const now = new Date().toISOString();
  
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: options.createdBy ?? 'admin',
    ip: options.ip || '127.0.0.1' // Will be updated with real IP when saved
  };
};

export type { BaseMetadata, CreateMetadataOptions, UpdateMetadataOptions };