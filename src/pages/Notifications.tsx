
import React from 'react';
import Header from '@/components/Header';
import { useBetPal } from '@/contexts/BetPalContext';
import NotificationList from '@/components/NotificationList';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { isLoggedIn } = useBetPal();
  const navigate = useNavigate();
  
  // Redirect to login if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-gray-500 mb-8">Stay updated on your betting activities</p>
        
        <div className="max-w-2xl mx-auto">
          <NotificationList />
        </div>
      </main>
    </div>
  );
};

export default Notifications;
