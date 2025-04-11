
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Friend } from '@/types/bet.types';
import { 
  fetchFriends, 
  addFriend, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend 
} from '@/services/friendService';

type FriendsContextType = {
  friends: Friend[];
  pendingRequests: Friend[];
  sentRequests: Friend[];
  loadingFriends: boolean;
  addFriend: (usernameOrEmail: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  refreshFriends: () => Promise<void>;
};

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    if (user) {
      loadFriends();
    } else {
      // Reset state when user logs out
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setLoadingFriends(false);
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    
    setLoadingFriends(true);
    try {
      const result = await fetchFriends(user.id);
      setFriends(result.friends);
      setPendingRequests(result.pendingRequests);
      setSentRequests(result.sentRequests);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleAddFriend = async (usernameOrEmail: string) => {
    if (!user || !profile) return;
    
    const success = await addFriend(user.id, profile.username, usernameOrEmail);
    if (success) {
      await loadFriends();
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    if (!user || !profile) return;
    
    const success = await acceptFriendRequest(user.id, profile.username, friendshipId);
    if (success) {
      await loadFriends();
    }
  };

  const handleRejectFriendRequest = async (friendshipId: string) => {
    const success = await rejectFriendRequest(friendshipId);
    if (success) {
      await loadFriends();
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    const success = await removeFriend(friendshipId);
    if (success) {
      await loadFriends();
    }
  };

  const refreshFriends = async () => {
    await loadFriends();
  };

  const value = {
    friends,
    pendingRequests,
    sentRequests,
    loadingFriends,
    addFriend: handleAddFriend,
    acceptFriendRequest: handleAcceptFriendRequest,
    rejectFriendRequest: handleRejectFriendRequest,
    removeFriend: handleRemoveFriend,
    refreshFriends
  };

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}
