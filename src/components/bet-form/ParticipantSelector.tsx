
import React, { useState, useEffect } from 'react';
import { X, PlusCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FormLabel } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/contexts/FriendsContext';

interface ParticipantSelectorProps {
  participants: string[];
  setParticipants: React.Dispatch<React.SetStateAction<string[]>>;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({ 
  participants, 
  setParticipants 
}) => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [participantInput, setParticipantInput] = useState('');
  const [isParticipantPopoverOpen, setIsParticipantPopoverOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string, username: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Load friends when popup opens
  useEffect(() => {
    if (isParticipantPopoverOpen) {
      const friendUsernames = friends.map(friend => {
        // Get the other user from the friendship
        if (friend.user_id === user?.id) {
          return { id: friend.friend_id, username: friend.profile?.username || '' };
        } else {
          return { id: friend.user_id, username: friend.profile?.username || '' };
        }
      }).filter(friend => friend.username && !participants.includes(friend.username));
      
      setSearchResults(friendUsernames as { id: string, username: string }[]);
    }
  }, [isParticipantPopoverOpen, friends, participants, user?.id]);

  // Search for users
  useEffect(() => {
    if (!participantInput || participantInput.length < 2 || !isParticipantPopoverOpen) return;

    const searchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', `%${participantInput}%`)
          .order('username')
          .limit(10);

        if (error) {
          console.error('Error searching users:', error);
          return;
        }

        setSearchResults(data.filter(user => !participants.includes(user.username)) || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [participantInput, isParticipantPopoverOpen, participants]);

  const addParticipant = (username: string) => {
    // Check if already added
    if (participants.includes(username)) {
      toast.error(`'${username}' is already added`);
      return;
    }
    
    // Add participant
    setParticipants([...participants, username]);
    setParticipantInput('');
    toast.success(`Added ${username} to the bet`);
    setIsParticipantPopoverOpen(false);
  };

  const removeParticipant = (username: string) => {
    setParticipants(participants.filter(p => p !== username));
  };

  return (
    <div>
      <FormLabel>Participants</FormLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {participants.map(participant => (
          <div 
            key={participant} 
            className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-md"
          >
            <span className="mr-1">{participant}</span>
            <button 
              type="button" 
              onClick={() => removeParticipant(participant)}
              className="text-blue-500 hover:text-blue-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 items-center">
        <Popover open={isParticipantPopoverOpen} onOpenChange={setIsParticipantPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-9 flex items-center gap-1"
            >
              <PlusCircle size={16} />
              <span>Add Friends</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="bottom" align="start">
            <Command>
              <CommandInput 
                placeholder="Search username..." 
                value={participantInput}
                onValueChange={setParticipantInput}
              />
              <CommandEmpty>
                {loading ? 'Searching...' : 'No users found'}
              </CommandEmpty>
              <CommandGroup>
                {searchResults.map(user => (
                  <CommandItem 
                    key={user.id}
                    onSelect={() => addParticipant(user.username)}
                  >
                    <User size={16} className="mr-2" />
                    {user.username}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ParticipantSelector;
