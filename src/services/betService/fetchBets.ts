
import { supabase } from "@/integrations/supabase/client";
import { Bet, BetStatus, ParticipantStatus, ResolutionType } from "@/types/bet.types";

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
