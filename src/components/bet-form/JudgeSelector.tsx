
import React from 'react';
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

// Mock user data for demonstration - in a real app, this would come from the context or an API
const mockUsers = [
  { id: 'user1', username: 'user1' },
  { id: 'user2', username: 'user2' },
  { id: 'user3', username: 'user3' },
  { id: 'john_doe', username: 'john_doe' },
  { id: 'jane_smith', username: 'jane_smith' },
];

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
  judge: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface JudgeSelectorProps {
  form: UseFormReturn<FormValues>;
  participants: string[];
}

const JudgeSelector: React.FC<JudgeSelectorProps> = ({ form, participants }) => {
  const [isJudgePopoverOpen, setIsJudgePopoverOpen] = React.useState(false);

  return (
    <FormField
      control={form.control}
      name="judge"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Judge (Username)</FormLabel>
          <FormControl>
            <Popover open={isJudgePopoverOpen} onOpenChange={setIsJudgePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {field.value ? field.value : "Select a judge..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="bottom" align="start">
                <Command>
                  <CommandInput placeholder="Search username..." />
                  <CommandEmpty>No user found</CommandEmpty>
                  <CommandGroup>
                    {mockUsers
                      .filter(user => !participants.includes(user.username))
                      .map(user => (
                        <CommandItem 
                          key={user.id}
                          onSelect={() => {
                            field.onChange(user.username);
                            setIsJudgePopoverOpen(false);
                          }}
                        >
                          <User size={16} className="mr-2" />
                          {user.username}
                        </CommandItem>
                      ))
                    }
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
