// Shared resources storage using SQLite database

export interface StoredResource {
  id: number;
  title: string;
  description: string;
  type: 'article' | 'video' | 'book' | 'worksheet' | 'reference';
  category: string;
  url: string;
  author: string;
  rating: number;
  downloads: number;
  tags: string[];
  createdAt: string;
  duration?: string;
}

// API endpoint for resources
const API_BASE = '/api';

// Fetch all resources from database
export const getAllResources = async (): Promise<StoredResource[]> => {
  try {
    const response = await fetch(`${API_BASE}/resources`);
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    const data = await response.json();
    return data.resources?.map(transformResourceFromDB) || [];
  } catch (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
};

// Transform database resource format to StoredResource format
const transformResourceFromDB = (dbResource: any): StoredResource => {
  return {
    id: dbResource.id,
    title: dbResource.title,
    description: dbResource.description,
    type: dbResource.type,
    category: dbResource.category,
    url: dbResource.url,
    author: dbResource.author,
    rating: dbResource.rating,
    downloads: dbResource.downloads,
    tags: dbResource.tags ? dbResource.tags.split(',') : [],
    createdAt: dbResource.created_at,
    duration: dbResource.duration
  };
};

// Create a new resource
export const createResource = async (resourceData: {
  title: string;
  description: string;
  type: 'article' | 'video' | 'book' | 'worksheet' | 'reference';
  category: string;
  url: string;
  author: string;
  tags: string[];
  duration?: string;
}): Promise<StoredResource> => {
  try {
    const response = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create resource');
    }
    
    const data = await response.json();
    return transformResourceFromDB(data.resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

// Get resources by type
export const getResourcesByType = async (type: 'article' | 'video' | 'book' | 'worksheet' | 'reference'): Promise<StoredResource[]> => {
  try {
    const response = await fetch(`${API_BASE}/resources/type/${type}`);
    if (!response.ok) {
      throw new Error('Failed to fetch resources by type');
    }
    
    const data = await response.json();
    return data.resources?.map(transformResourceFromDB) || [];
  } catch (error) {
    console.error('Error fetching resources by type:', error);
    return [];
  }
};

// Note: Sample resources are now initialized in the server-side database setup
export const initializeSampleResources = async (): Promise<void> => {
  // Check if resources already exist
  const resources = await getAllResources();
  if (resources.length > 0) return; // Already has data
  
  // Sample data is handled by server initialization
  console.log('Sample resources initialization handled by server');
};
