
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    
    // Direct update winner's balance and stats
    const { data: winnerProfile } = await supabase
      .from('profiles')
      .select('token_balance, total_wins')
      .eq('id', winnerId)
      .single();
    
    if (winnerProfile) {
      const { error: updateWinnerError } = await supabase
        .from('profiles')
        .update({
          token_balance: winnerProfile.token_balance + totalWinnings,
          total_wins: winnerProfile.total_wins + 1
        })
        .eq('id', winnerId);
      
      if (updateWinnerError) {
        console.error('Error updating winner stats:', updateWinnerError);
      }
    }
    
    // Update losers' stats
    const loserIds = participants
      .map(p => p.participant_id)
      .filter(id => id !== winnerId);
    
    if (bet.created_by !== winnerId) {
      loserIds.push(bet.created_by);
    }
    
    // Update each loser individually (more reliable than bulk update)
    for (const loserId of loserIds) {
      const { data: loserProfile } = await supabase
        .from('profiles')
        .select('total_losses')
        .eq('id', loserId)
        .single();
      
      if (loserProfile) {
        await supabase
          .from('profiles')
          .update({
            total_losses: loserProfile.total_losses + 1
          })
          .eq('id', loserId);
      }
    }
    
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
