
import React from 'react';
import { useBetPal } from '@/contexts/BetPalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationList: React.FC = () => {
  const { notifications, markNotificationAsRead, currentUser } = useBetPal();
  
  if (!currentUser) return null;
  
  const userNotifications = notifications.filter(n => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bet_invite':
        return <Bell className="h-5 w-5 text-betting-accent" />;
      case 'bet_accepted':
        return <Check className="h-5 w-5 text-betting-secondary" />;
      case 'bet_completed':
        return <Check className="h-5 w-5 text-betting-win" />;
      case 'tokens_received':
        return <div className="token w-5 h-5"><span className="token-text text-[10px]">T</span></div>;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };
  
  if (userNotifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">You have no notifications yet</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border rounded-lg flex items-start ${
              !notification.read ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'
            }`}
          >
            <div className="mr-3 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-grow">
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
              
              {notification.betId && (
                <Link to={`/bets/${notification.betId}`} className="text-xs text-betting-primary hover:underline mt-2 inline-block">
                  View Bet
                </Link>
              )}
            </div>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkAsRead(notification.id)}
                className="ml-2"
              >
                Mark as read
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationList;
