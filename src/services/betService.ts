import { supabase } from "@/integrations/supabase/client";
import { Bet, BetCreateData, BetStatus, ParticipantStatus, ResolutionType } from "@/types/bet.types";
import { toast } from "sonner";

export const fetchUserBets = async (userId: string): Promise<Bet[]> => {
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
      .eq('created_by', userId);

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
      .eq('participant_id', userId)
      .eq('status', 'accepted');

    if (createdError || participatingError) {
      console.error('Error fetching bets:', createdError || participatingError);
      return [];
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
        
        // Safely handle potentially undefined or null judge/winner
        const safeJudge = bet.judge && !('error' in bet.judge) ? bet.judge : null;
        const safeWinner = bet.winner && !('error' in bet.winner) ? bet.winner : null;

        return {
          ...bet,
          status: bet.status as BetStatus,
          resolution_type: bet.resolution_type as ResolutionType,
          judge: safeJudge,
          winner: safeWinner,
          participants: participants?.map(p => ({
            id: p.profile?.id || '',
            username: p.profile?.username || '',
            avatar_url: p.profile?.avatar_url,
            status: p.status as ParticipantStatus
          })) || []
        };
      })
    );

    return betsWithParticipants as Bet[];
  } catch (error) {
    console.error('Error fetching bets:', error);
    return [];
  }
};

export const createBet = async (
  betData: BetCreateData, 
  user: { id: string }, 
  profile: { username: string, token_balance: number },
  refreshProfile: () => Promise<void>
): Promise<boolean> => {
  if (betData.stake > (profile.token_balance || 0)) {
    toast.error('Insufficient tokens');
    return false;
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
      return false;
    }

    // Add participants - betData.participants is a string[] of usernames
    const participantPromises = betData.participants.map(async (participantUsername) => {
      // Convert username to id
      const { data: participantData } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', participantUsername)
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
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        token_balance: profile.token_balance - betData.stake
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating token balance:', updateError);
    }

    // Refresh the user profile to update token balance
    await refreshProfile();
    
    toast.success('Bet created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating bet:', error);
    toast.error('An error occurred');
    return false;
  }
};

export const joinBet = async (
  betId: string,
  user: { id: string },
  profile: { username: string, token_balance: number },
  refreshProfile: () => Promise<void>
): Promise<boolean> => {
  try {
    // Get the bet to check stake amount
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('*, creator:profiles!bets_created_by_fkey(username)')
      .eq('id', betId)
      .single();
    
    if (betError || !bet) {
      toast.error('Error fetching bet details');
      return false;
    }
    
    // Check if user has enough tokens
    if (bet.stake > profile.token_balance) {
      toast.error('Insufficient tokens');
      return false;
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
      return false;
    }
    
    if (!participant) {
      toast.error('You were not invited to this bet');
      return false;
    }
    
    if (participant.status === 'accepted') {
      toast.error('You already joined this bet');
      return false;
    }
    
    // Update participant status
    const { error: updateError } = await supabase
      .from('bet_participants')
      .update({ status: 'accepted' })
      .eq('id', participant.id);
    
    if (updateError) {
      toast.error('Error joining the bet');
      return false;
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
    return true;
  } catch (error) {
    console.error('Error joining bet:', error);
    toast.error('An error occurred');
    return false;
  }
};

export const resolveBet = async (
  betId: string, 
  winnerId: string,
  user: { id: string },
  refreshProfile: () => Promise<void>
): Promise<boolean> => {
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
      return false;
    }
    
    if (bet.status !== 'active') {
      toast.error('This bet cannot be resolved');
      return false;
    }
    
    // Get all participants for token calculation
    const { data: participants } = await supabase
      .from('bet_participants')
      .select('participant_id')
      .eq('bet_id', betId)
      .eq('status', 'accepted');
    
    if (!participants) {
      toast.error('No participants found for this bet');
      return false;
    }
    
    // Check authorization
    const isParticipant = participants.some(p => p.participant_id === user.id) || bet.created_by === user.id;
    const isJudge = bet.judge_id === user.id;
    
    if (bet.resolution_type === 'self' && !isParticipant) {
      toast.error('Only participants can resolve this bet');
      return false;
    }
    
    if (bet.resolution_type === 'judge' && !isJudge) {
      toast.error('Only the judge can resolve this bet');
      return false;
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
      return false;
    }
    
    // Calculate winnings
    const totalParticipants = (participants?.length || 0) + 1; // +1 for creator
    const totalWinnings = bet.stake * totalParticipants;
    
    // Update winner's balance and stats
    await supabase.rpc('increment', {
      table_name: 'profiles',
      column_name: 'token_balance',
      row_id: winnerId,
      amount: totalWinnings
    } as any);
    
    await supabase.rpc('increment', {
      table_name: 'profiles',
      column_name: 'total_wins',
      row_id: winnerId,
      amount: 1
    } as any);
    
    // Update losers' stats
    const loserIds = participants
      .map(p => p.participant_id)
      .filter(id => id !== winnerId);
    
    if (bet.created_by !== winnerId) {
      loserIds.push(bet.created_by);
    }
    
    for (const loserId of loserIds) {
      await supabase.rpc('increment', {
        table_name: 'profiles',
        column_name: 'total_losses',
        row_id: loserId,
        amount: 1
      } as any);
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
    return true;
  } catch (error) {
    console.error('Error resolving bet:', error);
    toast.error('An error occurred');
    return false;
  }
};

export const getBetDetails = async (betId: string, userId: string): Promise<Bet | null> => {
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
    
    // Handle potentially null judge or winner
    const safeJudge = data.judge && !('error' in data.judge) ? data.judge : null;
    const safeWinner = data.winner && !('error' in data.winner) ? data.winner : null;
    
    const formattedBet: Bet = {
      ...data,
      status: data.status as BetStatus,
      resolution_type: data.resolution_type as ResolutionType,
      judge: safeJudge,
      winner: safeWinner,
      participants: participants?.map(p => ({
        id: p.profile?.id || '',
        username: p.profile?.username || '',
        avatar_url: p.profile?.avatar_url,
        status: p.status as ParticipantStatus
      })) || []
    };
    
    return formattedBet;
  } catch (error) {
    console.error('Error fetching bet details:', error);
    return null;
  }
};

export const inviteParticipant = async (
  betId: string, 
  username: string,
  userId: string,
  profileUsername: string
): Promise<boolean> => {
  try {
    // Find the user by username
    const { data: participantUser, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .maybeSingle();
    
    if (userError || !participantUser) {
      toast.error('User not found');
      return false;
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
      return false;
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
      return false;
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
        message: `${profileUsername} invited you to bet: ${bet?.title}`,
        type: 'bet_invite',
        bet_id: betId
      });
    
    toast.success(`Invited ${participantUser.username} to the bet`);
    return true;
  } catch (error) {
    console.error('Error inviting participant:', error);
    toast.error('An error occurred');
    return false;
  }
};

export const respondToInvitation = async (
  betId: string, 
  accept: boolean,
  user: { id: string },
  profile: { username: string, token_balance: number },
  refreshProfile: () => Promise<void>
): Promise<boolean> => {
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
      return false;
    }
    
    if (invitation.bet.status !== 'pending') {
      toast.error('This bet is no longer accepting participants');
      return false;
    }
    
    if (accept) {
      // Check if user has enough tokens
      if (invitation.bet.stake > profile.token_balance) {
        toast.error('Insufficient tokens');
        return false;
      }
      
      // Accept invitation
      const { error: acceptError } = await supabase
        .from('bet_participants')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);
      
      if (acceptError) {
        toast.error('Error accepting invitation');
        return false;
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
        return false;
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
    return true;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    toast.error('An error occurred');
    return false;
  }
};
