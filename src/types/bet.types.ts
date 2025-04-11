
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
  } | null;
  winner?: {
    username: string;
    avatar_url: string | null;
  } | null;
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

export type BetCreateData = Omit<Bet, 'id' | 'created_at' | 'status' | 'updated_at'> & { 
  participants: string[] 
};
