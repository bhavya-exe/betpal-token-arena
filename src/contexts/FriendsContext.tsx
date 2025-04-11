import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export type FriendStatus = 'pending' | 'accepted' | 'rejected';

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
  };
};

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
      fetchFriends();
    } else {
      // Reset state when user logs out
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setLoadingFriends(false);
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    
    setLoadingFriends(true);
    
    try {
      // Fetch accepted friendships where the user is either the sender or receiver
      const { data: acceptedFriends, error: acceptedError } = await supabase
        .from('friendships')
        .select(`
          *,
          profile:profiles!friendships_friend_id_fkey(
            id, username, email, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const { data: acceptedFriends2, error: acceptedError2 } = await supabase
        .from('friendships')
        .select(`
          *,
          profile:profiles!friendships_user_id_fkey(
            id, username, email, avatar_url
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'accepted');

      // Fetch pending friend requests received by the user
      const { data: pendingFriends, error: pendingError } = await supabase
        .from('friendships')
        .select(`
          *,
          profile:profiles!friendships_user_id_fkey(
            id, username, email, avatar_url
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Fetch friend requests sent by the user
      const { data: sentFriends, error: sentError } = await supabase
        .from('friendships')
        .select(`
          *,
          profile:profiles!friendships_friend_id_fkey(
            id, username, email, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (acceptedError || acceptedError2 || pendingError || sentError) {
        console.error('Error fetching friends:', acceptedError || acceptedError2 || pendingError || sentError);
        return;
      }

      setFriends([
        ...(acceptedFriends?.map(f => ({...f, status: f.status as FriendStatus})) || []), 
        ...(acceptedFriends2?.map(f => ({...f, status: f.status as FriendStatus})) || [])
      ]);
      setPendingRequests(pendingFriends?.map(f => ({...f, status: f.status as FriendStatus})) || []);
      setSentRequests(sentFriends?.map(f => ({...f, status: f.status as FriendStatus})) || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const addFriend = async (usernameOrEmail: string) => {
    if (!user) {
      toast.error('You must be logged in to add friends');
      return;
    }

    try {
      // First find the user by username or email
      const { data: foundUser, error: findError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
        .maybeSingle();

      if (findError) {
        toast.error('Error finding user');
        return;
      }

      if (!foundUser) {
        toast.error('User not found');
        return;
      }

      // Check if the user is trying to add themselves
      if (foundUser.id === user.id) {
        toast.error('You cannot add yourself as a friend');
        return;
      }

      // Check if there's already a friendship
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${foundUser.id}),and(user_id.eq.${foundUser.id},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (checkError) {
        toast.error('Error checking friendship status');
        return;
      }

      if (existingFriendship) {
        toast.error('Friend request already exists');
        return;
      }

      // Create friendship request
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: foundUser.id,
          status: 'pending'
        });

      if (insertError) {
        toast.error('Error sending friend request');
        return;
      }

      // Create a notification for the friend
      await supabase
        .from('notifications')
        .insert({
          user_id: foundUser.id,
          message: `${profile?.username} sent you a friend request`,
          type: 'friend_request'
        });

      toast.success(`Friend request sent to ${foundUser.username}`);
      await fetchFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      toast.error('An error occurred');
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user) return;

    try {
      const { data: friendship, error: fetchError } = await supabase
        .from('friendships')
        .select('*, user:profiles!friendships_user_id_fkey(username)')
        .eq('id', friendshipId)
        .single();

      if (fetchError || !friendship) {
        toast.error('Error fetching friendship details');
        return;
      }

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) {
        toast.error('Error accepting friend request');
        return;
      }

      // Create a notification for the other user
      await supabase
        .from('notifications')
        .insert({
          user_id: friendship.user_id,
          message: `${profile?.username} accepted your friend request`,
          type: 'friend_accepted',
          friendship_id: friendshipId
        });

      toast.success(`You are now friends with ${friendship.user.username}`);
      await fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('An error occurred');
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) {
        toast.error('Error rejecting friend request');
        return;
      }

      toast.success('Friend request rejected');
      await fetchFriends();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('An error occurred');
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        toast.error('Error removing friend');
        return;
      }

      toast.success('Friend removed');
      await fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('An error occurred');
    }
  };

  const refreshFriends = async () => {
    await fetchFriends();
  };

  const value = {
    friends,
    pendingRequests,
    sentRequests,
    loadingFriends,
    addFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
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
