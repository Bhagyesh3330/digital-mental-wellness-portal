'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Heart, 
  BookOpen, 
  FileText,
  Video,
  Download,
  Search,
  Filter,
  Plus,
  Star,
  Clock,
  User,
  Tag,
  X,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
// Updated to use database API instead of localStorage

interface AddResourceData {
  title: string;
  description: string;
  type: 'article' | 'video' | 'book';
  url: string;
  category: string;
  tags: string;
}

const ResourcesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);

  const {
    register: registerResource,
    handleSubmit: handleResourceSubmit,
    formState: { errors: resourceErrors },
    reset: resetResourceForm
  } = useForm<AddResourceData>();

  const categories = [
    { id: 'all', name: 'All Resources' },
    { id: 'anxiety', name: 'Anxiety & Stress' },
    { id: 'depression', name: 'Depression' },
    { id: 'academic', name: 'Academic Support' },
    { id: 'relationships', name: 'Relationships' },
    { id: 'mindfulness', name: 'Mindfulness' },
    { id: 'crisis', name: 'Crisis Support' }
  ];

  useEffect(() => {
    if (!user) {
      router.push('/dashboard');
      return;
    }
    
    // Fetch resources from database API
    const fetchResources = async () => {
      try {
        console.log('Fetching resources from database API...');
        const response = await fetch('/api/resources');
        const data = await response.json();
        
        if (response.ok && data.resources) {
          console.log('Loaded resources from database:', data.resources.length);
          // Transform the data to match expected format
          const transformedResources = data.resources.map((resource: any) => ({
            ...resource,
            tags: resource.tags ? resource.tags.split(',') : []
          }));
          setResources(transformedResources);
        } else {
          console.error('Failed to fetch resources:', data.error);
          setResources([]);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [user, router]);

  const onAddResource = async (data: AddResourceData) => {
    try {
      // Convert tags string to array
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      
      // Create new resource using database API
      const resourceData = {
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        url: data.url,
        author: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous',
        tags: tagsArray
      };
      
      console.log('Creating resource with data:', resourceData);
      
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resourceData),
      });
      
      const result = await response.json();
      console.log('Create resource API response:', result);
      
      if (response.ok && result.resource) {
        // Transform the tags back to array format for frontend
        const newResource = {
          ...result.resource,
          tags: result.resource.tags ? result.resource.tags.split(',') : []
        };
        
        // Add to resources list at the beginning
        setResources(prev => [newResource, ...prev]);
        
        console.log('Resource created and saved:', newResource);
        toast.success('Resource added successfully and saved to database!');
        resetResourceForm();
        setShowAddResourceModal(false);
      } else {
        console.error('Failed to create resource:', result.error);
        toast.error(result.error || 'Failed to add resource');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to add resource');
    }
  };

  const filteredResources = resources.filter((resource: any) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some((tag: any) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText;
      case 'video': return Video;
      case 'worksheet': return BookOpen;
      case 'reference': return Heart;
      default: return FileText;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-wellness-primary/20 text-wellness-primary';
      case 'video': return 'bg-wellness-secondary/20 text-wellness-secondary';
      case 'worksheet': return 'bg-wellness-success/20 text-wellness-success';
      case 'reference': return 'bg-wellness-warning/20 text-wellness-warning';
      default: return 'bg-netflix-gray-medium/20 text-netflix-gray-medium';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="spinner w-8 h-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Heart className="w-8 h-8 text-wellness-primary" />
              Wellness Resources
            </h1>
            <p className="text-netflix-gray-light mt-2">
              {user?.role === 'student' 
                ? 'Access helpful materials shared by counselors and wellness experts'
                : 'Manage and share wellness resources with all students'
              }
            </p>
          </div>
          
          {user?.role === 'counselor' && (
            <button 
              onClick={() => setShowAddResourceModal(true)}
              className="btn-wellness px-6 py-3 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Resource
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-netflix-gray-medium" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-netflix pl-10 pr-4 py-3 w-full"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-netflix px-4 py-3 min-w-48"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Resources</p>
                <p className="text-2xl font-bold text-white">{resources.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-wellness-primary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Articles</p>
                <p className="text-2xl font-bold text-white">
                  {resources.filter(r => r.type === 'article').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-wellness-secondary" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Videos</p>
                <p className="text-2xl font-bold text-white">
                  {resources.filter(r => r.type === 'video').length}
                </p>
              </div>
              <Video className="w-8 h-8 text-wellness-success" />
            </div>
          </div>

          <div className="card-netflix p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-netflix-gray-light text-sm mb-1">Total Downloads</p>
                <p className="text-2xl font-bold text-white">
                  {resources.reduce((sum, r) => sum + r.downloads, 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-wellness-warning" />
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource, index) => {
              const IconComponent = getResourceIcon(resource.type);
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-netflix p-6 hover:bg-netflix-black-light transition-colors duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-wellness-primary/20 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-wellness-primary" />
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                          {resource.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-wellness-warning fill-current" />
                      <span className="text-sm text-white">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {resource.title}
                  </h3>
                  
                  <p className="text-sm text-netflix-gray-light mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-netflix-gray-medium mb-4">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{resource.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>{resource.downloads}</span>
                    </div>
                    {resource.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{resource.duration}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map((tag: any, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-netflix-gray-dark rounded-full text-xs text-netflix-gray-light"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="btn-wellness flex-1 py-2 text-sm flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button className="btn-wellness-outline px-4 py-2 text-sm">
                      Preview
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-16 h-16 text-netflix-gray-medium mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No resources found</h3>
              <p className="text-netflix-gray-light">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Resources will be available soon.'}
              </p>
            </div>
          )}
        </div>

        {/* Add Resource Modal */}
        <AnimatePresence>
          {showAddResourceModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddResourceModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-netflix p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Add New Resource</h3>
                  <button
                    onClick={() => setShowAddResourceModal(false)}
                    className="text-netflix-gray-light hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleResourceSubmit(onAddResource)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Title *
                    </label>
                    <input
                      {...registerResource('title', { required: 'Title is required' })}
                      type="text"
                      className="input-netflix w-full"
                      placeholder="Enter resource title"
                    />
                    {resourceErrors.title && (
                      <p className="text-netflix-red text-sm mt-1">{resourceErrors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Description *
                    </label>
                    <textarea
                      {...registerResource('description', { required: 'Description is required' })}
                      className="input-netflix w-full h-24 resize-none"
                      placeholder="Describe the resource and its purpose"
                    />
                    {resourceErrors.description && (
                      <p className="text-netflix-red text-sm mt-1">{resourceErrors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Resource Type *
                    </label>
                    <select
                      {...registerResource('type', { required: 'Resource type is required' })}
                      className="input-netflix w-full"
                    >
                      <option value="">Select type</option>
                      <option value="article">Article</option>
                      <option value="video">Video</option>
                      <option value="book">Book</option>
                    </select>
                    {resourceErrors.type && (
                      <p className="text-netflix-red text-sm mt-1">{resourceErrors.type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Category *
                    </label>
                    <select
                      {...registerResource('category', { required: 'Category is required' })}
                      className="input-netflix w-full"
                    >
                      <option value="">Select category</option>
                      <option value="anxiety">Anxiety & Stress</option>
                      <option value="depression">Depression</option>
                      <option value="academic">Academic Support</option>
                      <option value="relationships">Relationships</option>
                      <option value="mindfulness">Mindfulness</option>
                      <option value="crisis">Crisis Support</option>
                    </select>
                    {resourceErrors.category && (
                      <p className="text-netflix-red text-sm mt-1">{resourceErrors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Resource URL *
                    </label>
                    <input
                      {...registerResource('url', { 
                        required: 'URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please enter a valid URL starting with http:// or https://'
                        }
                      })}
                      type="url"
                      className="input-netflix w-full"
                      placeholder="https://example.com/resource"
                    />
                    {resourceErrors.url && (
                      <p className="text-netflix-red text-sm mt-1">{resourceErrors.url.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-netflix-gray-light mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      {...registerResource('tags')}
                      type="text"
                      className="input-netflix w-full"
                      placeholder="mindfulness, stress, coping, etc."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddResourceModal(false)}
                      className="flex-1 btn-wellness-outline py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-wellness py-3"
                    >
                      Add Resource
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResourcesPage;
