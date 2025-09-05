import type { Metadata } from 'next'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/context/AuthContext'
import { CelebrationAnimation } from '@/components/ui/CelebrationAnimation'
import { WellnessAnimations } from '@/components/ui/WellnessAnimations'
// Import debug utilities for browser console access
import '@/lib/debug-utils'
import '@/lib/test-data'
import '@/lib/force-cleanup'
import '@/lib/registration-debug'
import '@/lib/test-registration-fix'
import '@/lib/fix-appointments'
import '@/lib/direct-appointment-fix'

export const metadata: Metadata = {
  title: 'Digital Mental Wellness Portal',
  description: 'Comprehensive mental wellness platform for hostel communities',
  keywords: ['mental health', 'wellness', 'student support', 'counseling'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="font-professional bg-netflix-black min-h-screen">
        <AuthProvider>
          {children}
          <CelebrationAnimation />
          <WellnessAnimations />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F1F1F',
                color: '#ffffff',
                border: '1px solid #2F2F2F',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
