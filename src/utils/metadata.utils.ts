interface BaseMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  ip?: string;
}

interface CreateMetadataOptions extends Partial<Pick<BaseMetadata, 'createdBy' | 'ip'>> {
  // Create-specific options can be added here in the future
}

interface UpdateMetadataOptions extends Partial<Pick<BaseMetadata, 'createdBy' | 'ip'>> {
  // For semantic clarity, we can also accept updatedBy as an alias
  updatedBy?: string;
}

export const createMetadata = (options: CreateMetadataOptions = {}): BaseMetadata => {
  const now = new Date().toISOString();
  
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: options.createdBy || 'admin',
    ip: options.ip || '127.0.0.1'
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

export const mergeMetadata = (existingMetadata: Partial<BaseMetadata> = {}, options: CreateMetadataOptions = {}): BaseMetadata => {
  const now = new Date().toISOString();
  
  return {
    createdAt: existingMetadata.createdAt || now,
    updatedAt: now,
    createdBy: existingMetadata.createdBy || options.createdBy || 'admin',
    ip: existingMetadata.ip || options.ip || '127.0.0.1'
  };
};

export type { BaseMetadata, CreateMetadataOptions, UpdateMetadataOptions };