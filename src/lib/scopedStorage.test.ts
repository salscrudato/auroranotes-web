/**
 * Tests for user-scoped localStorage utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setStorageUserId,
  getStorageUserId,
  scopedKey,
  getScopedItem,
  setScopedItem,
  removeScopedItem,
  clearUserStorage,
  clearAllAuroraStorage,
  ScopedStorageKeys,
} from './scopedStorage';

describe('scopedStorage', () => {
  beforeEach(() => {
    // Clear localStorage and reset user ID before each test
    localStorage.clear();
    setStorageUserId(null);
  });

  afterEach(() => {
    localStorage.clear();
    setStorageUserId(null);
  });

  describe('setStorageUserId / getStorageUserId', () => {
    it('should set and get user ID', () => {
      expect(getStorageUserId()).toBeNull();
      setStorageUserId('user123');
      expect(getStorageUserId()).toBe('user123');
    });

    it('should allow clearing user ID', () => {
      setStorageUserId('user123');
      setStorageUserId(null);
      expect(getStorageUserId()).toBeNull();
    });
  });

  describe('scopedKey', () => {
    it('should create scoped key with current user ID', () => {
      setStorageUserId('user123');
      expect(scopedKey('myKey')).toBe('myKey:user:user123');
    });

    it('should use provided uid over current user ID', () => {
      setStorageUserId('user123');
      expect(scopedKey('myKey', 'otherUser')).toBe('myKey:user:otherUser');
    });

    it('should return unscoped key when no user ID is set', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(scopedKey('myKey')).toBe('myKey');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No user ID set'));
      consoleSpy.mockRestore();
    });
  });

  describe('getScopedItem / setScopedItem', () => {
    it('should store and retrieve scoped items', () => {
      setStorageUserId('user123');
      setScopedItem('testKey', { foo: 'bar' });
      expect(getScopedItem('testKey')).toEqual({ foo: 'bar' });
    });

    it('should isolate data between users', () => {
      setStorageUserId('user1');
      setScopedItem('testKey', { user: 1 });

      setStorageUserId('user2');
      setScopedItem('testKey', { user: 2 });

      // User 2 should see their own data
      expect(getScopedItem('testKey')).toEqual({ user: 2 });

      // User 1 should see their own data
      setStorageUserId('user1');
      expect(getScopedItem('testKey')).toEqual({ user: 1 });
    });

    it('should return null for non-existent keys', () => {
      setStorageUserId('user123');
      expect(getScopedItem('nonExistent')).toBeNull();
    });

    it('should handle complex objects', () => {
      setStorageUserId('user123');
      const complexData = {
        array: [1, 2, 3],
        nested: { a: { b: 'c' } },
        date: '2024-01-01',
      };
      setScopedItem('complex', complexData);
      expect(getScopedItem('complex')).toEqual(complexData);
    });
  });

  describe('removeScopedItem', () => {
    it('should remove scoped items', () => {
      setStorageUserId('user123');
      setScopedItem('testKey', 'value');
      expect(getScopedItem('testKey')).toBe('value');

      removeScopedItem('testKey');
      expect(getScopedItem('testKey')).toBeNull();
    });

    it('should not affect other users data', () => {
      setStorageUserId('user1');
      setScopedItem('testKey', 'user1Value');

      setStorageUserId('user2');
      setScopedItem('testKey', 'user2Value');
      removeScopedItem('testKey');

      // User 1's data should still exist
      setStorageUserId('user1');
      expect(getScopedItem('testKey')).toBe('user1Value');
    });
  });

  describe('clearUserStorage', () => {
    it('should clear all storage for current user', () => {
      setStorageUserId('user123');
      setScopedItem('key1', 'value1');
      setScopedItem('key2', 'value2');

      clearUserStorage();

      expect(getScopedItem('key1')).toBeNull();
      expect(getScopedItem('key2')).toBeNull();
    });

    it('should not affect other users storage', () => {
      setStorageUserId('user1');
      setScopedItem('key1', 'user1Value');

      setStorageUserId('user2');
      setScopedItem('key1', 'user2Value');
      clearUserStorage();

      // User 1's data should still exist
      setStorageUserId('user1');
      expect(getScopedItem('key1')).toBe('user1Value');
    });
  });

  describe('clearAllAuroraStorage', () => {
    it('should clear all aurora-prefixed keys', () => {
      localStorage.setItem('aurora_test', 'value1');
      localStorage.setItem('auroranotes_test', 'value2');
      localStorage.setItem('other_key', 'value3');

      clearAllAuroraStorage();

      expect(localStorage.getItem('aurora_test')).toBeNull();
      expect(localStorage.getItem('auroranotes_test')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('value3');
    });

    it('should clear scoped aurora keys', () => {
      setStorageUserId('user123');
      setScopedItem('aurora_chat', 'chatData');

      clearAllAuroraStorage();

      expect(getScopedItem('aurora_chat')).toBeNull();
    });
  });

  describe('ScopedStorageKeys', () => {
    it('should generate scoped keys for all storage types', () => {
      setStorageUserId('user123');

      expect(ScopedStorageKeys.chatHistory()).toContain(':user:user123');
      expect(ScopedStorageKeys.chatHistoryThreads()).toContain(':user:user123');
      expect(ScopedStorageKeys.activeThread()).toContain(':user:user123');
      expect(ScopedStorageKeys.pinnedNotes()).toContain(':user:user123');
      expect(ScopedStorageKeys.savedViews()).toContain(':user:user123');
      expect(ScopedStorageKeys.chatFilters()).toContain(':user:user123');
      expect(ScopedStorageKeys.conversations()).toContain(':user:user123');
      expect(ScopedStorageKeys.recentActions()).toContain(':user:user123');
    });
  });
});

