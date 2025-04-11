
import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
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
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Define the form schema used in the parent component
const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  stake: z.number().min(1, { message: 'Stake must be at least 1 token' }),
  deadline: z.string().refine(value => {
    const date = new Date(value);
    const now = new Date();
    return date > now;
  }, { message: 'Deadline must be in the future' }),
  resolutionType: z.enum(['self', 'judge']),
  judge_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type UserWithUsername = {
  id: string;
  username: string;
};

interface JudgeSelectorProps {
  form: UseFormReturn<FormValues>;
  participants: string[];
}

const JudgeSelector: React.FC<JudgeSelectorProps> = ({ form, participants }) => {
  const [isJudgePopoverOpen, setIsJudgePopoverOpen] = useState(false);
  const [availableJudges, setAvailableJudges] = useState<UserWithUsername[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch users for potential judges
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .order('username');

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        setAvailableJudges(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isJudgePopoverOpen) {
      fetchUsers();
    }
  }, [isJudgePopoverOpen]);

  // Filter judges based on search term and exclude participants
  const filteredJudges = availableJudges.filter(user => 
    !participants.includes(user.username) && 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get selected judge username for display
  const [selectedJudgeUsername, setSelectedJudgeUsername] = useState<string>('');
  
  useEffect(() => {
    const getJudgeUsername = async () => {
      const judgeId = form.watch('judge_id');
      if (!judgeId) {
        setSelectedJudgeUsername('');
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', judgeId)
          .single();
          
        if (data) {
          setSelectedJudgeUsername(data.username);
        }
      } catch (error) {
        console.error('Error fetching judge username:', error);
      }
    };
    
    getJudgeUsername();
  }, [form.watch('judge_id')]);

  return (
    <FormField
      control={form.control}
      name="judge_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Judge</FormLabel>
          <FormControl>
            <Popover open={isJudgePopoverOpen} onOpenChange={setIsJudgePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedJudgeUsername ? selectedJudgeUsername : "Select a judge..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="bottom" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search username..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandEmpty>{loading ? 'Loading...' : 'No user found'}</CommandEmpty>
                  <CommandGroup>
                    {filteredJudges.map(user => (
                      <CommandItem 
                        key={user.id}
                        onSelect={() => {
                          field.onChange(user.id);
                          setSelectedJudgeUsername(user.username);
                          setIsJudgePopoverOpen(false);
                        }}
                      >
                        <User size={16} className="mr-2" />
                        {user.username}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default JudgeSelector;
