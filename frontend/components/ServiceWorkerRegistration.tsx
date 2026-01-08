"use client";

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 * 
 * Registers the service worker for offline support and PWA functionality.
 * Following best practices for service worker lifecycle management.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration.scope);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to refresh
                  console.log('[SW] New version available! Please refresh.');
                  
                  // Optionally show a toast notification
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sw-update-available'));
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });
      
      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading page...');
        window.location.reload();
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
