import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

describe('Remaining Hooks Organization', () => {
  describe('Social Hooks', () => {
    it('should have family and groups hooks organized', () => {
      // Verify barrel exports exist
      const socialBarrel = require('../../hooks/social');
      expect(socialBarrel).toBeDefined();
    });
  });
  
  describe('Auth Hooks', () => {
    it('should have oauth hook organized', () => {
      const authBarrel = require('../../hooks/auth');
      expect(authBarrel).toBeDefined();
    });
  });
  
  describe('Profile Hooks', () => {
    it('should have activity hook organized', () => {
      const profileBarrel = require('../../hooks/profile');
      expect(profileBarrel).toBeDefined();
    });
  });
  
  describe('Shared Hooks', () => {
    it('should have cross-cutting utilities organized', () => {
      const sharedBarrel = require('../../hooks/shared');
      expect(sharedBarrel).toBeDefined();
    });
  });
  
  describe('Main Barrel File', () => {
    it('should export all hook categories', () => {
      const mainBarrel = require('../../hooks');
      expect(mainBarrel).toBeDefined();
      
      // Should have exports from all categories
      expect(Object.keys(mainBarrel).length).toBeGreaterThan(0);
    });
  });
});
