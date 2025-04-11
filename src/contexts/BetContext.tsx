
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Bet, BetCreateData, Notification } from '@/types/bet.types';
import * as betService from '@/services/betService';
import * as notificationService from '@/services/notificationService';

type BetContextType = {
  bets: Bet[];
  notifications: Notification[];
  loadingBets: boolean;
  loadingNotifications: boolean;
  createBet: (bet: BetCreateData) => Promise<void>;
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
      const fetchedBets = await betService.fetchUserBets(user.id);
      setBets(fetchedBets);
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
      const fetchedNotifications = await notificationService.fetchUserNotifications(user.id);
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const createBet = async (betData: BetCreateData) => {
    if (!user || !profile) {
      return;
    }
    
    const success = await betService.createBet(betData, user, profile, refreshProfile);
    if (success) {
      await fetchBets();
    }
  };

  const joinBet = async (betId: string) => {
    if (!user || !profile) {
      return;
    }
    
    const success = await betService.joinBet(betId, user, profile, refreshProfile);
    if (success) {
      await fetchBets();
    }
  };

  const resolveBet = async (betId: string, winnerId: string) => {
    if (!user || !profile) {
      return;
    }
    
    const success = await betService.resolveBet(betId, winnerId, user, refreshProfile);
    if (success) {
      await fetchBets();
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    
    const success = await notificationService.markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev => prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, read: true };
        }
        return n;
      }));
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
    return betService.getBetDetails(betId, user.id);
  };

  const inviteParticipant = async (betId: string, username: string) => {
    if (!user || !profile) return;
    
    const success = await betService.inviteParticipant(betId, username, user.id, profile.username);
    if (success) {
      await fetchBets();
    }
  };

  const respondToInvitation = async (betId: string, accept: boolean) => {
    if (!user || !profile) return;
    
    const success = await betService.respondToInvitation(betId, accept, user, profile, refreshProfile);
    if (success) {
      await fetchBets();
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
