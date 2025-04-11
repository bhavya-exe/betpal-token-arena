
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export type BetStatus = 'pending' | 'active' | 'completed';
export type ResolutionType = 'self' | 'judge';
export type ParticipantStatus = 'invited' | 'accepted' | 'rejected';
export type NotificationType = 'bet_invite' | 'bet_accepted' | 'bet_completed' | 'tokens_received' | 'friend_request' | 'friend_accepted' | 'bet_rejected';

export type Bet = {
  id: string;
  title: string;
  description: string;
  stake: number;
  deadline: string;
  status: BetStatus;
  resolution_type: ResolutionType;
  created_at: string;
  created_by: string;
  winner_id: string | null;
  judge_id: string | null;
  updated_at: string;
  creator?: {
    username: string;
    avatar_url: string | null;
  };
  participants?: Array<{
    id: string;
    username: string;
    avatar_url: string | null;
    status?: ParticipantStatus;
  }>;
  judge?: {
    username: string;
    avatar_url: string | null;
  };
  winner?: {
    username: string;
    avatar_url: string | null;
  };
};

export type BetParticipant = {
  id: string;
  bet_id: string;
  participant_id: string;
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
};

export type Notification = {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  type: NotificationType;
  bet_id?: string;
  friendship_id?: string;
};

type BetContextType = {
  bets: Bet[];
  notifications: Notification[];
  loadingBets: boolean;
  loadingNotifications: boolean;
  createBet: (bet: Omit<Bet, 'id' | 'created_at' | 'status' | 'updated_at'> & { participants: string[] }) => Promise<void>;
  joinBet: (betId: string) => Promise<void>;
  resolveBet: (betId: string, winnerId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  getUnreadNotificationsCount: () => number;
  refreshBets: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  getBetDetails: (betId: string) => Promise<Bet | null>;
  inviteParticipant: (betId: string, participantId: string) => Promise<void>;
  respondToInvitation: (betId: string, accept: boolean) => Promise<void>;
};

const BetContext = createContext<BetContextType | undefined>(undefined);

export function BetProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingBets, setLoadingBets] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBets();
      fetchNotifications();
    } else {
      setBets([]);
      setNotifications([]);
      setLoadingBets(false);
      setLoadingNotifications(false);
    }
  }, [user]);

  const fetchBets = async () => {
    if (!user) return;
    
    setLoadingBets(true);
    
    try {
      // Get all bets the user created
      const { data: createdBets, error: createdError } = await supabase
        .from('bets')
        .select(`
          *,
          creator:profiles!bets_created_by_fkey(username, avatar_url),
          judge:profiles(username, avatar_url),
          winner:profiles(username, avatar_url)
        `)
        .eq('created_by', user.id);

      // Get all bets the user is participating in
      const { data: participatingBets, error: participatingError } = await supabase
        .from('bet_participants')
        .select(`
          bet:bets(
            *,
            creator:profiles!bets_created_by_fkey(username, avatar_url),
            judge:profiles(username, avatar_url),
            winner:profiles(username, avatar_url)
          )
        `)
        .eq('participant_id', user.id)
        .eq('status', 'accepted');

      if (createdError || participatingError) {
        console.error('Error fetching bets:', createdError || participatingError);
        return;
      }

      // Combine and format bets
      const createdBetsFormatted = createdBets || [];
      const participatingBetsFormatted = participatingBets 
        ? participatingBets.map(item => item.bet).filter(Boolean)
        : [];

      // Get unique bets by ID
      const combinedBets = [...createdBetsFormatted];
      participatingBetsFormatted.forEach((bet: any) => {
        if (!combinedBets.some(b => b.id === bet.id)) {
          combinedBets.push(bet);
        }
      });

      // Get participants for each bet
      const betsWithParticipants = await Promise.all(
        combinedBets.map(async (bet) => {
          const { data: participants } = await supabase
            .from('bet_participants')
            .select('*, profile:profiles(id, username, avatar_url)')
            .eq('bet_id', bet.id);
          
          return {
            ...bet,
            status: bet.status as BetStatus,
            resolution_type: bet.resolution_type as ResolutionType,
            participants: participants?.map(p => ({
              id: p.profile?.id || '',
              username: p.profile?.username || '',
              avatar_url: p.profile?.avatar_url,
              status: p.status as ParticipantStatus
            }))
          } as Bet;
        })
      );

      setBets(betsWithParticipants);
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoadingBets(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoadingNotifications(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data?.map(notification => ({
        ...notification,
        type: notification.type as NotificationType
      })) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const createBet = async (betData: Omit<Bet, 'id' | 'created_at' | 'status' | 'updated_at'> & { participants: string[] }) => {
    if (!user || !profile) {
      toast.error('You must be logged in to create a bet');
      return;
    }
    
    if (betData.stake > (profile.token_balance || 0)) {
      toast.error('Insufficient tokens');
      return;
    }
    
    try {
      // First insert the bet
      const { data: newBet, error: betError } = await supabase
        .from('bets')
        .insert({
          title: betData.title,
          description: betData.description,
          stake: betData.stake,
          deadline: betData.deadline,
          resolution_type: betData.resolution_type,
          created_by: user.id,
          judge_id: betData.resolution_type === 'judge' ? betData.judge_id : null,
          status: 'pending'
        })
        .select()
        .single();

      if (betError || !newBet) {
        toast.error('Error creating bet');
        console.error('Error creating bet:', betError);
        return;
      }

      // Add participants
      const participantPromises = betData.participants.map(async (participant) => {
        const { data: participantData } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', participant)
          .single();

        if (participantData) {
          // Add participant to bet
          await supabase
            .from('bet_participants')
            .insert({
              bet_id: newBet.id,
              participant_id: participantData.id,
              status: 'invited'
            });

          // Create notification for participant
          await supabase
            .from('notifications')
            .insert({
              user_id: participantData.id,
              message: `${profile.username} invited you to bet: ${newBet.title}`,
              type: 'bet_invite',
              bet_id: newBet.id
            });
        }
      });

      await Promise.all(participantPromises);

      // Update user's token balance (tokens are held in escrow)
      await supabase
        .from('profiles')
        .update({
          token_balance: profile.token_balance - betData.stake
        })
        .eq('id', user.id);

      // Refresh the user profile to update token balance
      await refreshProfile();
      
      toast.success('Bet created successfully!');
      await fetchBets();
    } catch (error) {
      console.error('Error creating bet:', error);
      toast.error('An error occurred');
    }
  };

  const joinBet = async (betId: string) => {
    if (!user || !profile) {
      toast.error('You must be logged in to join a bet');
      return;
    }
    
    try {
      // Get the bet to check stake amount
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .select('*, creator:profiles!bets_created_by_fkey(username)')
        .eq('id', betId)
        .single();
      
      if (betError || !bet) {
        toast.error('Error fetching bet details');
        return;
      }
      
      // Check if user has enough tokens
      if (bet.stake > profile.token_balance) {
        toast.error('Insufficient tokens');
        return;
      }
      
      // Get the participant record
      const { data: participant, error: participantError } = await supabase
        .from('bet_participants')
        .select()
        .eq('bet_id', betId)
        .eq('participant_id', user.id)
        .maybeSingle();
      
      if (participantError) {
        toast.error('Error checking participation status');
        return;
      }
      
      if (!participant) {
        toast.error('You were not invited to this bet');
        return;
      }
      
      if (participant.status === 'accepted') {
        toast.error('You already joined this bet');
        return;
      }
      
      // Update participant status
      const { error: updateError } = await supabase
        .from('bet_participants')
        .update({ status: 'accepted' })
        .eq('id', participant.id);
      
      if (updateError) {
        toast.error('Error joining the bet');
        return;
      }
      
      // Update bet status if this is the last participant needed
      // We're keeping it simple for now - if any participant accepts, bet becomes active
      const { error: betUpdateError } = await supabase
        .from('bets')
        .update({ status: 'active' })
        .eq('id', betId);
      
      if (betUpdateError) {
        console.error('Error updating bet status:', betUpdateError);
      }
      
      // Update user's token balance (tokens are held in escrow)
      const { error: tokenError } = await supabase
        .from('profiles')
        .update({
          token_balance: profile.token_balance - bet.stake
        })
        .eq('id', user.id);
      
      if (tokenError) {
        console.error('Error updating token balance:', tokenError);
      }
      
      // Create notification for bet creator
      await supabase
        .from('notifications')
        .insert({
          user_id: bet.created_by,
          message: `${profile.username} has joined your bet: ${bet.title}`,
          type: 'bet_accepted',
          bet_id: betId
        });
      
      // Refresh the user profile to update token balance
      await refreshProfile();
      
      toast.success('Joined bet successfully!');
      await fetchBets();
    } catch (error) {
      console.error('Error joining bet:', error);
      toast.error('An error occurred');
    }
  };

  const resolveBet = async (betId: string, winnerId: string) => {
    if (!user || !profile) {
      toast.error('You must be logged in to resolve a bet');
      return;
    }
    
    try {
      // Get the bet to check authorization
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .select(`
          *,
          participants:bet_participants(participant_id, profile:profiles(username))
        `)
        .eq('id', betId)
        .single();
      
      if (betError || !bet) {
        toast.error('Error fetching bet details');
        return;
      }
      
      if (bet.status !== 'active') {
        toast.error('This bet cannot be resolved');
        return;
      }
      
      // Get all participants for token calculation
      const { data: participants } = await supabase
        .from('bet_participants')
        .select('participant_id')
        .eq('bet_id', betId)
        .eq('status', 'accepted');
      
      // Check authorization
      const isParticipant = participants?.some(p => p.participant_id === user.id) || bet.created_by === user.id;
      const isJudge = bet.judge_id === user.id;
      
      if (bet.resolution_type === 'self' && !isParticipant) {
        toast.error('Only participants can resolve this bet');
        return;
      }
      
      if (bet.resolution_type === 'judge' && !isJudge) {
        toast.error('Only the judge can resolve this bet');
        return;
      }
      
      // Update bet status and set winner
      const { error: updateError } = await supabase
        .from('bets')
        .update({
          status: 'completed',
          winner_id: winnerId
        })
        .eq('id', betId);
      
      if (updateError) {
        toast.error('Error resolving bet');
        return;
      }
      
      // Calculate winnings
      const totalParticipants = (participants?.length || 0) + 1; // +1 for creator
      const totalWinnings = bet.stake * totalParticipants;
      
      // Update winner's balance and stats
      const { error: winnerError } = await supabase
        .from('profiles')
        .update({
          token_balance: supabase.rpc('increment', { x: totalWinnings }),
          total_wins: supabase.rpc('increment', { x: 1 })
        })
        .eq('id', winnerId);
      
      if (winnerError) {
        console.error('Error updating winner stats:', winnerError);
      }
      
      // Update losers' stats
      const loserIds = participants
        ?.map(p => p.participant_id)
        .filter(id => id !== winnerId) || [];
      
      if (bet.created_by !== winnerId) {
        loserIds.push(bet.created_by);
      }
      
      for (const loserId of loserIds) {
        await supabase
          .from('profiles')
          .update({
            total_losses: supabase.rpc('increment', { x: 1 })
          })
          .eq('id', loserId);
      }
      
      // Get winner's username for notifications
      const { data: winnerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', winnerId)
        .single();
      
      // Create notifications for all participants
      const allParticipantIds = [...new Set([...loserIds, winnerId])];
      
      for (const participantId of allParticipantIds) {
        const isWinner = participantId === winnerId;
        const notificationMessage = isWinner
          ? `Congratulations! You won the bet: ${bet.title}`
          : `The bet: ${bet.title} was decided. ${winnerProfile?.username} won.`;
        
        await supabase
          .from('notifications')
          .insert({
            user_id: participantId,
            message: notificationMessage,
            type: 'bet_completed',
            bet_id: betId
          });
      }
      
      // If current user is the winner, refresh their profile
      if (user.id === winnerId) {
        await refreshProfile();
      }
      
      toast.success('Bet resolved successfully!');
      await fetchBets();
    } catch (error) {
      console.error('Error resolving bet:', error);
      toast.error('An error occurred');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      setNotifications(prev => prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, read: true };
        }
        return n;
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getUnreadNotificationsCount = () => {
    if (!user) return 0;
    return notifications.filter(n => !n.read).length;
  };

  const refreshBets = async () => {
    await fetchBets();
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const getBetDetails = async (betId: string): Promise<Bet | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          creator:profiles!bets_created_by_fkey(username, avatar_url),
          judge:profiles(username, avatar_url),
          winner:profiles(username, avatar_url)
        `)
        .eq('id', betId)
        .single();
      
      if (error || !data) {
        console.error('Error fetching bet details:', error);
        return null;
      }
      
      // Get participants for this bet
      const { data: participants } = await supabase
        .from('bet_participants')
        .select('*, profile:profiles(id, username, avatar_url)')
        .eq('bet_id', betId);
      
      const formattedBet: Bet = {
        ...data,
        status: data.status as BetStatus,
        resolution_type: data.resolution_type as ResolutionType,
        participants: participants?.map(p => ({
          id: p.profile?.id || '',
          username: p.profile?.username || '',
          avatar_url: p.profile?.avatar_url,
          status: p.status as ParticipantStatus
        }))
      };
      
      return formattedBet;
    } catch (error) {
      console.error('Error fetching bet details:', error);
      return null;
    }
  };

  const inviteParticipant = async (betId: string, username: string) => {
    if (!user || !profile) return;
    
    try {
      // Find the user by username
      const { data: participantUser, error: userError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .maybeSingle();
      
      if (userError || !participantUser) {
        toast.error('User not found');
        return;
      }
      
      // Check if already invited
      const { data: existingInvite } = await supabase
        .from('bet_participants')
        .select()
        .eq('bet_id', betId)
        .eq('participant_id', participantUser.id)
        .maybeSingle();
      
      if (existingInvite) {
        toast.error('User is already invited to this bet');
        return;
      }
      
      // Add participant to bet
      const { error: participantError } = await supabase
        .from('bet_participants')
        .insert({
          bet_id: betId,
          participant_id: participantUser.id,
          status: 'invited'
        });
      
      if (participantError) {
        toast.error('Error inviting participant');
        return;
      }
      
      // Get bet details for notification
      const { data: bet } = await supabase
        .from('bets')
        .select('title')
        .eq('id', betId)
        .single();
      
      // Create notification for participant
      await supabase
        .from('notifications')
        .insert({
          user_id: participantUser.id,
          message: `${profile.username} invited you to bet: ${bet?.title}`,
          type: 'bet_invite',
          bet_id: betId
        });
      
      toast.success(`Invited ${participantUser.username} to the bet`);
      await fetchBets();
    } catch (error) {
      console.error('Error inviting participant:', error);
      toast.error('An error occurred');
    }
  };

  const respondToInvitation = async (betId: string, accept: boolean) => {
    if (!user || !profile) return;
    
    try {
      // Get the bet invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('bet_participants')
        .select('id, bet:bets(stake, created_by, title, status)')
        .eq('bet_id', betId)
        .eq('participant_id', user.id)
        .single();
      
      if (inviteError || !invitation || !invitation.bet) {
        toast.error('Invitation not found');
        return;
      }
      
      if (invitation.bet.status !== 'pending') {
        toast.error('This bet is no longer accepting participants');
        return;
      }
      
      if (accept) {
        // Check if user has enough tokens
        if (invitation.bet.stake > profile.token_balance) {
          toast.error('Insufficient tokens');
          return;
        }
        
        // Accept invitation
        const { error: acceptError } = await supabase
          .from('bet_participants')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);
        
        if (acceptError) {
          toast.error('Error accepting invitation');
          return;
        }
        
        // Update bet status to active
        await supabase
          .from('bets')
          .update({ status: 'active' })
          .eq('id', betId);
        
        // Update user's token balance
        await supabase
          .from('profiles')
          .update({
            token_balance: profile.token_balance - invitation.bet.stake
          })
          .eq('id', user.id);
        
        // Create notification for bet creator
        await supabase
          .from('notifications')
          .insert({
            user_id: invitation.bet.created_by,
            message: `${profile.username} accepted your bet: ${invitation.bet.title}`,
            type: 'bet_accepted',
            bet_id: betId
          });
        
        toast.success('Bet accepted successfully');
      } else {
        // Reject invitation
        const { error: rejectError } = await supabase
          .from('bet_participants')
          .update({ status: 'rejected' })
          .eq('id', invitation.id);
        
        if (rejectError) {
          toast.error('Error rejecting invitation');
          return;
        }
        
        // Create notification for bet creator
        await supabase
          .from('notifications')
          .insert({
            user_id: invitation.bet.created_by,
            message: `${profile.username} rejected your bet: ${invitation.bet.title}`,
            type: 'bet_rejected',
            bet_id: betId
          });
        
        toast.info('Bet rejected');
      }
      
      // Refresh profile and bets
      await refreshProfile();
      await fetchBets();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('An error occurred');
    }
  };

  const value = {
    bets,
    notifications,
    loadingBets,
    loadingNotifications,
    createBet,
    joinBet,
    resolveBet,
    markNotificationAsRead,
    getUnreadNotificationsCount,
    refreshBets,
    refreshNotifications,
    getBetDetails,
    inviteParticipant,
    respondToInvitation
  };

  return <BetContext.Provider value={value}>{children}</BetContext.Provider>;
}

export function useBet() {
  const context = useContext(BetContext);
  if (context === undefined) {
    throw new Error('useBet must be used within a BetProvider');
  }
  return context;
}
