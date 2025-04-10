
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

// Type definitions
export type User = {
  id: string;
  username: string;
  email: string;
  tokenBalance: number;
  totalWins: number;
  totalLosses: number;
};

export type BetStatus = 'pending' | 'active' | 'completed';
export type ResolutionType = 'self' | 'judge';

export type Bet = {
  id: string;
  title: string;
  description: string;
  stake: number;
  deadline: Date;
  status: BetStatus;
  resolutionType: ResolutionType;
  createdAt: Date;
  createdBy: string;
  participants: string[];
  winner?: string;
  judge?: string;
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: 'bet_invite' | 'bet_accepted' | 'bet_completed' | 'tokens_received';
  betId?: string;
};

// Context type
type BetPalContextType = {
  currentUser: User | null;
  bets: Bet[];
  notifications: Notification[];
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  createBet: (bet: Omit<Bet, 'id' | 'createdAt' | 'status' | 'participants'>) => void;
  joinBet: (betId: string) => void;
  resolveBet: (betId: string, winnerId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadNotificationsCount: () => number;
  isLoggedIn: boolean;
};

// Default values
const defaultContextValue: BetPalContextType = {
  currentUser: null,
  bets: [],
  notifications: [],
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  createBet: () => {},
  joinBet: () => {},
  resolveBet: () => {},
  markNotificationAsRead: () => {},
  getUnreadNotificationsCount: () => 0,
  isLoggedIn: false
};

// Create context
const BetPalContext = createContext<BetPalContextType>(defaultContextValue);

// Sample mock data
const mockUsers: User[] = [
  {
    id: '1',
    username: 'user1',
    email: 'user1@example.com',
    tokenBalance: 100,
    totalWins: 3,
    totalLosses: 1
  },
  {
    id: '2',
    username: 'user2',
    email: 'user2@example.com',
    tokenBalance: 100,
    totalWins: 1,
    totalLosses: 2
  },
  {
    id: '3',
    username: 'user3',
    email: 'user3@example.com',
    tokenBalance: 100,
    totalWins: 0,
    totalLosses: 1
  }
];

const mockBets: Bet[] = [
  {
    id: 'bet1',
    title: 'Drink 3L of water in 24 hours',
    description: 'I bet I can drink 3 liters of water in 24 hours',
    stake: 20,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'active',
    resolutionType: 'judge',
    createdAt: new Date(),
    createdBy: '1',
    participants: ['1', '2'],
    judge: '3'
  },
  {
    id: 'bet2',
    title: 'Run a 5k under 30 minutes',
    description: 'I bet I can run a 5k in under 30 minutes',
    stake: 15,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
    resolutionType: 'self',
    createdAt: new Date(),
    createdBy: '2',
    participants: ['2']
  },
  {
    id: 'bet3',
    title: 'No social media for a week',
    description: 'I bet I can go a week without social media',
    stake: 50,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'completed',
    resolutionType: 'self',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    createdBy: '1',
    participants: ['1', '3'],
    winner: '1'
  }
];

// Provider component
export const BetPalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bets, setBets] = useState<Bet[]>(mockBets);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('betpal_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);
  
  // Mock login function
  const login = async (email: string, password: string) => {
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      toast.error('Invalid email or password');
      throw new Error('Invalid email or password');
    }
    
    // In a real app, we would validate password here
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('betpal_user', JSON.stringify(user));
    
    // Generate welcome back notification
    const welcomeNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId: user.id,
      message: `Welcome back, ${user.username}!`,
      read: false,
      createdAt: new Date(),
      type: 'tokens_received'
    };
    
    setNotifications(prev => [welcomeNotification, ...prev]);
    toast.success(`Welcome back, ${user.username}!`);
  };
  
  // Mock signup function
  const signup = async (username: string, email: string, password: string) => {
    if (mockUsers.some(u => u.email === email)) {
      toast.error('Email already in use');
      throw new Error('Email already in use');
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      email,
      tokenBalance: 100, // Start with 100 tokens
      totalWins: 0,
      totalLosses: 0
    };
    
    // Add user to mock data
    mockUsers.push(newUser);
    
    // Set as current user
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    localStorage.setItem('betpal_user', JSON.stringify(newUser));
    
    // Generate welcome notification
    const welcomeNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId: newUser.id,
      message: `Welcome to BetPal, ${username}! You've received 100 tokens to start.`,
      read: false,
      createdAt: new Date(),
      type: 'tokens_received'
    };
    
    setNotifications([welcomeNotification]);
    toast.success('Account created successfully!');
  };
  
  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('betpal_user');
    toast.info('Logged out successfully');
  };
  
  // Create a bet
  const createBet = (betData: Omit<Bet, 'id' | 'createdAt' | 'status' | 'participants'>) => {
    if (!currentUser) {
      toast.error('You must be logged in to create a bet');
      return;
    }
    
    if (betData.stake > currentUser.tokenBalance) {
      toast.error('Insufficient tokens');
      return;
    }
    
    const newBet: Bet = {
      ...betData,
      id: `bet-${Date.now()}`,
      createdAt: new Date(),
      status: 'pending', // Until other party joins
      participants: [currentUser.id]
    };
    
    setBets(prev => [newBet, ...prev]);
    
    // Update user's token balance (tokens are held in escrow)
    setCurrentUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tokenBalance: prev.tokenBalance - betData.stake
      };
    });
    
    // Update localStorage
    if (currentUser) {
      localStorage.setItem('betpal_user', JSON.stringify({
        ...currentUser,
        tokenBalance: currentUser.tokenBalance - betData.stake
      }));
    }
    
    toast.success('Bet created successfully!');
  };
  
  // Join a bet
  const joinBet = (betId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to join a bet');
      return;
    }
    
    const bet = bets.find(b => b.id === betId);
    
    if (!bet) {
      toast.error('Bet not found');
      return;
    }
    
    if (bet.participants.includes(currentUser.id)) {
      toast.error('You are already participating in this bet');
      return;
    }
    
    if (bet.stake > currentUser.tokenBalance) {
      toast.error('Insufficient tokens');
      return;
    }
    
    // Update bet status and add participant
    setBets(prev => prev.map(b => {
      if (b.id === betId) {
        return {
          ...b,
          status: 'active',
          participants: [...b.participants, currentUser.id]
        };
      }
      return b;
    }));
    
    // Update user's token balance (tokens are held in escrow)
    setCurrentUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tokenBalance: prev.tokenBalance - bet.stake
      };
    });
    
    // Update localStorage
    if (currentUser) {
      localStorage.setItem('betpal_user', JSON.stringify({
        ...currentUser,
        tokenBalance: currentUser.tokenBalance - bet.stake
      }));
    }
    
    // Create notification for bet creator
    const joinNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId: bet.createdBy,
      message: `${currentUser.username} has joined your bet: ${bet.title}`,
      read: false,
      createdAt: new Date(),
      type: 'bet_accepted',
      betId: bet.id
    };
    
    setNotifications(prev => [joinNotification, ...prev]);
    toast.success('Joined bet successfully!');
  };
  
  // Resolve a bet
  const resolveBet = (betId: string, winnerId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to resolve a bet');
      return;
    }
    
    const bet = bets.find(b => b.id === betId);
    
    if (!bet) {
      toast.error('Bet not found');
      return;
    }
    
    if (bet.status !== 'active') {
      toast.error('This bet cannot be resolved');
      return;
    }
    
    // Check if user is authorized to resolve
    const isParticipant = bet.participants.includes(currentUser.id);
    const isJudge = bet.judge === currentUser.id;
    
    if (bet.resolutionType === 'self' && !isParticipant) {
      toast.error('Only participants can resolve this bet');
      return;
    }
    
    if (bet.resolutionType === 'judge' && !isJudge) {
      toast.error('Only the judge can resolve this bet');
      return;
    }
    
    // Update bet status and set winner
    setBets(prev => prev.map(b => {
      if (b.id === betId) {
        return {
          ...b,
          status: 'completed',
          winner: winnerId
        };
      }
      return b;
    }));
    
    // Calculate winnings (stake from both participants)
    const totalWinnings = bet.stake * bet.participants.length;
    
    // Find winner in mock users and update their balance and stats
    const winnerIndex = mockUsers.findIndex(u => u.id === winnerId);
    if (winnerIndex !== -1) {
      mockUsers[winnerIndex] = {
        ...mockUsers[winnerIndex],
        tokenBalance: mockUsers[winnerIndex].tokenBalance + totalWinnings,
        totalWins: mockUsers[winnerIndex].totalWins + 1
      };
      
      // Update current user if they're the winner
      if (currentUser && currentUser.id === winnerId) {
        setCurrentUser({
          ...currentUser,
          tokenBalance: currentUser.tokenBalance + totalWinnings,
          totalWins: currentUser.totalWins + 1
        });
        localStorage.setItem('betpal_user', JSON.stringify({
          ...currentUser,
          tokenBalance: currentUser.tokenBalance + totalWinnings,
          totalWins: currentUser.totalWins + 1
        }));
      }
    }
    
    // Update losers' stats
    bet.participants.forEach(participantId => {
      if (participantId !== winnerId) {
        const loserIndex = mockUsers.findIndex(u => u.id === participantId);
        if (loserIndex !== -1) {
          mockUsers[loserIndex] = {
            ...mockUsers[loserIndex],
            totalLosses: mockUsers[loserIndex].totalLosses + 1
          };
          
          // Update current user if they're the loser
          if (currentUser && currentUser.id === participantId) {
            setCurrentUser({
              ...currentUser,
              totalLosses: currentUser.totalLosses + 1
            });
            localStorage.setItem('betpal_user', JSON.stringify({
              ...currentUser,
              totalLosses: currentUser.totalLosses + 1
            }));
          }
        }
      }
    });
    
    // Create resolution notifications for all participants
    const winnerUser = mockUsers.find(u => u.id === winnerId);
    
    bet.participants.forEach(participantId => {
      const isWinner = participantId === winnerId;
      const notificationMessage = isWinner
        ? `Congratulations! You won the bet: ${bet.title}`
        : `The bet: ${bet.title} was decided. ${winnerUser?.username} won.`;
        
      const resolveNotification: Notification = {
        id: `notif-${Date.now()}-${participantId}`,
        userId: participantId,
        message: notificationMessage,
        read: false,
        createdAt: new Date(),
        type: 'bet_completed',
        betId: bet.id
      };
      
      setNotifications(prev => [resolveNotification, ...prev]);
    });
    
    toast.success('Bet resolved successfully!');
  };
  
  // Mark notification as read
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId) {
        return { ...n, read: true };
      }
      return n;
    }));
  };
  
  // Get unread notifications count
  const getUnreadNotificationsCount = () => {
    if (!currentUser) return 0;
    return notifications.filter(n => n.userId === currentUser.id && !n.read).length;
  };
  
  const value = {
    currentUser,
    bets,
    notifications,
    login,
    signup,
    logout,
    createBet,
    joinBet,
    resolveBet,
    markNotificationAsRead,
    getUnreadNotificationsCount,
    isLoggedIn
  };
  
  return (
    <BetPalContext.Provider value={value}>
      {children}
    </BetPalContext.Provider>
  );
};

// Hook to use the BetPal context
export const useBetPal = () => useContext(BetPalContext);
