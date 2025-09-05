'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Settings } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

const UsersPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!user || user.role !== 'counselor') {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-netflix-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Users className="w-16 h-16 text-wellness-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-netflix-gray-light">
              This feature is coming soon. Manage all platform users from here.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              onClick={() => router.back()}
              className="btn-wellness-outline px-6 py-3"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
