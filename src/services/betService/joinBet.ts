import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
