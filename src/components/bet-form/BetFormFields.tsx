
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JudgeSelector from './JudgeSelector';

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

interface BetFormFieldsProps {
  form: UseFormReturn<FormValues>;
  participants: string[];
}

const BetFormFields: React.FC<BetFormFieldsProps> = ({ form, participants }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What's the bet about?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the conditions of the bet..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="stake"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stake (Tokens)</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-[50%] transform -translate-y-1/2">
                    <div className="token w-5 h-5">
                      <span className="token-text text-[10px]">T</span>
                    </div>
                  </div>
                  <Input
                    type="number"
                    className="pl-10"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="resolutionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="How will this bet be resolved?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="self">Self-resolved (both parties agree)</SelectItem>
                  <SelectItem value="judge">Judge-based (third party decides)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.watch('resolutionType') === 'judge' && (
          <JudgeSelector form={form} participants={participants} />
        )}
      </div>
    </div>
  );
};

export default BetFormFields;
