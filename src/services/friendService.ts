
import { supabase } from "@/integrations/supabase/client";
import { Friend, FriendStatus } from "@/types/bet.types";
import { toast } from "sonner";

export async function fetchFriends(userId: string): Promise<{
  friends: Friend[];
  pendingRequests: Friend[];
  sentRequests: Friend[];
}> {
  if (!userId) {
    return {
      friends: [],
      pendingRequests: [],
      sentRequests: []
    };
  }

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
      .eq('user_id', userId)
      .eq('status', 'accepted');

    const { data: acceptedFriends2, error: acceptedError2 } = await supabase
      .from('friendships')
      .select(`
        *,
        profile:profiles!friendships_user_id_fkey(
          id, username, email, avatar_url
        )
      `)
      .eq('friend_id', userId)
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
      .eq('friend_id', userId)
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
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (acceptedError || acceptedError2 || pendingError || sentError) {
      console.error('Error fetching friends:', acceptedError || acceptedError2 || pendingError || sentError);
      return {
        friends: [],
        pendingRequests: [],
        sentRequests: []
      };
    }

    return {
      friends: [
        ...(acceptedFriends?.map(f => ({...f, status: f.status as FriendStatus})) || []), 
        ...(acceptedFriends2?.map(f => ({...f, status: f.status as FriendStatus})) || [])
      ],
      pendingRequests: pendingFriends?.map(f => ({...f, status: f.status as FriendStatus})) || [],
      sentRequests: sentFriends?.map(f => ({...f, status: f.status as FriendStatus})) || []
    };
  } catch (error) {
    console.error('Error fetching friends:', error);
    return {
      friends: [],
      pendingRequests: [],
      sentRequests: []
    };
  }
}

export async function addFriend(userId: string, profileUsername: string | null, usernameOrEmail: string): Promise<boolean> {
  if (!userId) {
    toast.error('You must be logged in to add friends');
    return false;
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
      return false;
    }

    if (!foundUser) {
      toast.error('User not found');
      return false;
    }

    // Check if the user is trying to add themselves
    if (foundUser.id === userId) {
      toast.error('You cannot add yourself as a friend');
      return false;
    }

    // Check if there's already a friendship
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friendships')
      .select()
      .or(`and(user_id.eq.${userId},friend_id.eq.${foundUser.id}),and(user_id.eq.${foundUser.id},friend_id.eq.${userId})`)
      .maybeSingle();

    if (checkError) {
      toast.error('Error checking friendship status');
      return false;
    }

    if (existingFriendship) {
      toast.error('Friend request already exists');
      return false;
    }

    // Create friendship request
    const { error: insertError } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: foundUser.id,
        status: 'pending'
      });

    if (insertError) {
      toast.error('Error sending friend request');
      return false;
    }

    // Create a notification for the friend
    await supabase
      .from('notifications')
      .insert({
        user_id: foundUser.id,
        message: `${profileUsername} sent you a friend request`,
        type: 'friend_request'
      });

    toast.success(`Friend request sent to ${foundUser.username}`);
    return true;
  } catch (error) {
    console.error('Error adding friend:', error);
    toast.error('An error occurred');
    return false;
  }
}

export async function acceptFriendRequest(userId: string, profileUsername: string | null, friendshipId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*, user:profiles!friendships_user_id_fkey(username)')
      .eq('id', friendshipId)
      .single();

    if (fetchError || !friendship) {
      toast.error('Error fetching friendship details');
      return false;
    }

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) {
      toast.error('Error accepting friend request');
      return false;
    }

    // Create a notification for the other user
    await supabase
      .from('notifications')
      .insert({
        user_id: friendship.user_id,
        message: `${profileUsername} accepted your friend request`,
        type: 'friend_accepted',
        friendship_id: friendshipId
      });

    toast.success(`You are now friends with ${friendship.user.username}`);
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    toast.error('An error occurred');
    return false;
  }
}

export async function rejectFriendRequest(friendshipId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) {
      toast.error('Error rejecting friend request');
      return false;
    }

    toast.success('Friend request rejected');
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    toast.error('An error occurred');
    return false;
  }
}

export async function removeFriend(friendshipId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      toast.error('Error removing friend');
      return false;
    }

    toast.success('Friend removed');
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    toast.error('An error occurred');
    return false;
  }
}
