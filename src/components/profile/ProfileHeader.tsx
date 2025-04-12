
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Calendar, BarChart, Activity } from 'lucide-react';

interface ProfileHeaderProps {
  username: string;
  email: string;
  totalBetsCount: number;
  winRate: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  username, 
  email, 
  totalBetsCount, 
  winRate 
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-betting-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{username}</h2>
            <p className="text-gray-500">{email}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium">{username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">April 2025</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <BarChart size={18} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="font-medium">{winRate}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Total Bets</p>
              <p className="font-medium">{totalBetsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <Button variant="outline" className="w-full">Edit Profile</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
