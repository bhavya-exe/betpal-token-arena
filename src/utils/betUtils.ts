
import { Bet } from "@/types/bet.types";

export const filterUserBets = (
  bets: Bet[],
  userId: string
): {
  userBets: Bet[];
  createdBets: Bet[];
  participatedBets: Bet[];
  wonBets: Bet[];
} => {
  // Filter user's bets with safer type checking
  const userBets = bets.filter(bet => {
    // Check if the user is a participant
    const isParticipant = bet.participants?.some(p => {
      if (!p) return false;
      if (typeof p !== 'object') return false;
      if ('id' in p && p.id === userId) return true;
      return false;
    });
    // Check if the user is the creator
    const isCreator = 'created_by' in bet && bet.created_by === userId;
    return isParticipant || isCreator;
  });
  
  const createdBets = bets.filter(bet => 'created_by' in bet && bet.created_by === userId);
  
  const participatedBets = bets.filter(bet => {
    // Check if the user is a participant but not the creator
    const isParticipant = bet.participants?.some(p => {
      if (!p) return false;
      if (typeof p !== 'object') return false;
      if ('id' in p && p.id === userId) return true;
      return false;
    });
    const isCreator = 'created_by' in bet && bet.created_by === userId;
    return isParticipant && !isCreator;
  });
  
  const wonBets = bets.filter(bet => 
    'status' in bet && bet.status === 'completed' && 
    'winner_id' in bet && bet.winner_id === userId
  );
  
  return {
    userBets,
    createdBets,
    participatedBets,
    wonBets
  };
};

export const calculateWinRate = (wins: number, losses: number): number => {
  return wins > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
};

export const calculateTokensWon = (wonBets: Bet[]): number => {
  return wonBets.reduce((total, bet) => {
    if (!('stake' in bet) || !('participants' in bet)) return total;
    
    // Count participants who accepted the bet with safer type checking
    const participantCount = bet.participants?.filter(p => {
      if (!p) return false;
      if (typeof p !== 'object') return false;
      if ('status' in p && p.status === 'accepted') return true;
      return false;
    }).length || 0;
    
    return total + (bet.stake * (participantCount + 1)); // +1 for creator
  }, 0);
};
