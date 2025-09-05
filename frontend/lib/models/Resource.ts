import { getDatabase } from '@/lib/database/connection';

export interface ResourceData {
  id: number;
  title: string;
  description: string;
  type: 'article' | 'video' | 'book' | 'worksheet' | 'reference';
  category: string;
  url: string;
  author: string;
  rating: number;
  downloads: number;
  tags: string;
  duration?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceData {
  title: string;
  description: string;
  type: 'article' | 'video' | 'book' | 'worksheet' | 'reference';
  category: string;
  url: string;
  author: string;
  tags: string[];
  duration?: string;
}

export interface ResourceResult {
  success: boolean;
  resource?: ResourceData;
  error?: string;
}

export interface ResourcesResult {
  success: boolean;
  resources?: ResourceData[];
  error?: string;
}

export class Resource {
  private static getDb() {
    return getDatabase();
  }

  // Create a new resource
  static async create(data: CreateResourceData): Promise<ResourceResult> {
    const db = this.getDb();
    
    try {
      // Validate required fields
      if (!data.title?.trim()) {
        return { success: false, error: 'Title is required' };
      }
      
      if (!data.description?.trim()) {
        return { success: false, error: 'Description is required' };
      }
      
      if (!data.url?.trim()) {
        return { success: false, error: 'URL is required' };
      }
      
      if (!data.author?.trim()) {
        return { success: false, error: 'Author is required' };
      }

      const validTypes = ['article', 'video', 'book', 'worksheet', 'reference'];
      if (!validTypes.includes(data.type)) {
        return { success: false, error: 'Invalid resource type' };
      }

      const stmt = db.prepare(`
        INSERT INTO resources (
          title, description, type, category, url, author, 
          rating, downloads, tags, duration, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      const tagsStr = data.tags.join(',');

      const result = stmt.run(
        data.title.trim(),
        data.description.trim(),
        data.type,
        data.category.trim(),
        data.url.trim(),
        data.author.trim(),
        0, // Initial rating
        0, // Initial downloads
        tagsStr,
        data.duration || null,
        now,
        now
      );

      // Fetch the created resource
      const newResource = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid) as ResourceData;

      return { success: true, resource: newResource };
    } catch (error) {
      console.error('Error creating resource:', error);
      return { success: false, error: 'Failed to create resource' };
    }
  }

  // Find all resources
  static async findAll(): Promise<ResourceData[]> {
    const db = this.getDb();
    
    try {
      const resources = db.prepare(`
        SELECT * FROM resources 
        ORDER BY created_at DESC
      `).all() as ResourceData[];
      
      return resources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  // Find resource by ID
  static async findById(id: number): Promise<ResourceData | null> {
    const db = this.getDb();
    
    try {
      const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as ResourceData;
      return resource || null;
    } catch (error) {
      console.error('Error fetching resource by ID:', error);
      return null;
    }
  }

  // Find resources by type
  static async findByType(type: string): Promise<ResourceData[]> {
    const db = this.getDb();
    
    try {
      const resources = db.prepare(`
        SELECT * FROM resources 
        WHERE type = ? 
        ORDER BY created_at DESC
      `).all(type) as ResourceData[];
      
      db.close();
      return resources;
    } catch (error) {
      console.error('Error fetching resources by type:', error);
      db.close();
      return [];
    }
  }

  // Find resources by category
  static async findByCategory(category: string): Promise<ResourceData[]> {
    const db = this.getDb();
    
    try {
      const resources = db.prepare(`
        SELECT * FROM resources 
        WHERE category = ? 
        ORDER BY created_at DESC
      `).all(category) as ResourceData[];
      
      db.close();
      return resources;
    } catch (error) {
      console.error('Error fetching resources by category:', error);
      db.close();
      return [];
    }
  }

  // Update resource
  static async update(id: number, updates: Partial<CreateResourceData>): Promise<ResourceResult> {
    const db = this.getDb();
    
    try {
      // Check if resource exists
      const existingResource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as ResourceData;
      if (!existingResource) {
        db.close();
        return { success: false, error: 'Resource not found' };
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(updates.title.trim());
      }

      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description.trim());
      }

      if (updates.type !== undefined) {
        const validTypes = ['article', 'video', 'book', 'worksheet', 'reference'];
        if (!validTypes.includes(updates.type)) {
          db.close();
          return { success: false, error: 'Invalid resource type' };
        }
        updateFields.push('type = ?');
        updateValues.push(updates.type);
      }

      if (updates.category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(updates.category.trim());
      }

      if (updates.url !== undefined) {
        updateFields.push('url = ?');
        updateValues.push(updates.url.trim());
      }

      if (updates.author !== undefined) {
        updateFields.push('author = ?');
        updateValues.push(updates.author.trim());
      }

      if (updates.tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(updates.tags.join(','));
      }

      if (updates.duration !== undefined) {
        updateFields.push('duration = ?');
        updateValues.push(updates.duration);
      }

      if (updateFields.length === 0) {
        db.close();
        return { success: true, resource: existingResource };
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      const stmt = db.prepare(`
        UPDATE resources 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...updateValues);

      // Fetch updated resource
      const updatedResource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as ResourceData;

      db.close();
      return { success: true, resource: updatedResource };
    } catch (error) {
      console.error('Error updating resource:', error);
      db.close();
      return { success: false, error: 'Failed to update resource' };
    }
  }

  // Update resource rating and downloads
  static async updateStats(id: number, rating?: number, downloads?: number): Promise<ResourceResult> {
    const db = this.getDb();
    
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (rating !== undefined) {
        updateFields.push('rating = ?');
        updateValues.push(rating);
      }

      if (downloads !== undefined) {
        updateFields.push('downloads = downloads + ?');
        updateValues.push(downloads);
      }

      if (updateFields.length === 0) {
        const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as ResourceData;
        db.close();
        return { success: true, resource };
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      const stmt = db.prepare(`
        UPDATE resources 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...updateValues);

      const updatedResource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as ResourceData;

      db.close();
      return { success: true, resource: updatedResource };
    } catch (error) {
      console.error('Error updating resource stats:', error);
      db.close();
      return { success: false, error: 'Failed to update resource stats' };
    }
  }

  // Delete resource
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    const db = this.getDb();
    
    try {
      const stmt = db.prepare('DELETE FROM resources WHERE id = ?');
      const result = stmt.run(id);

      db.close();

      if (result.changes === 0) {
        return { success: false, error: 'Resource not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting resource:', error);
      db.close();
      return { success: false, error: 'Failed to delete resource' };
    }
  }

  // Search resources
  static async search(query: string, type?: string, category?: string): Promise<ResourceData[]> {
    const db = this.getDb();
    
    try {
      let sql = `
        SELECT * FROM resources 
        WHERE (title LIKE ? OR description LIKE ? OR tags LIKE ? OR author LIKE ?)
      `;
      const params = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];

      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }

      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }

      sql += ' ORDER BY rating DESC, downloads DESC';

      const resources = db.prepare(sql).all(...params) as ResourceData[];
      
      db.close();
      return resources;
    } catch (error) {
      console.error('Error searching resources:', error);
      db.close();
      return [];
    }
  }
}
