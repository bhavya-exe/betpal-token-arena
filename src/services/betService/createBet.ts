
import { supabase } from "@/integrations/supabase/client";
import { BetCreateData } from "@/types/bet.types";
import { toast } from "sonner";

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
