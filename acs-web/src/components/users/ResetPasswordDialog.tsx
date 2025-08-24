import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, RefreshCw, Eye, Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { usersService } from '@/services/users';
import { User } from '@/types/user';

interface ResetPasswordDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResetOption = 'display' | 'email';

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
  const queryClient = useQueryClient();
  const [resetOption, setResetOption] = useState<ResetOption>('display');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const displayPasswordMutation = useMutation({
    mutationFn: (userId: string) => usersService.adminResetPasswordAndDisplay(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setGeneratedPassword(data.data?.newPassword || null);
      toast.success('Password reset successfully. New password is displayed below.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const emailPasswordMutation = useMutation({
    mutationFn: (userId: string) => usersService.adminResetPasswordAndEmail(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        'Password reset successfully. New password has been sent to the user\'s email.'
      );
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password and send email');
    },
  });

  const handleResetPassword = () => {
    if (resetOption === 'display') {
      displayPasswordMutation.mutate(user.id);
    } else {
      emailPasswordMutation.mutate(user.id);
    }
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        setCopied(true);
        toast.success('Password copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy password');
      }
    }
  };

  const handleClose = () => {
    setGeneratedPassword(null);
    setCopied(false);
    setResetOption('display');
    onOpenChange(false);
  };

  const isPending = displayPasswordMutation.isPending || emailPasswordMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Admin Password Reset</span>
          </DialogTitle>
          <DialogDescription>
            Reset password for {user.name} ({user.username})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              This will generate a new secure password and replace the current password immediately. 
              The user will be required to change it on their next login.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">User Information:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Name:</span> {user.name}</p>
              <p><span className="font-medium">Username:</span> {user.username}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Employee ID:</span> {user.employeeId}</p>
            </div>
          </div>

          <Separator />

          {!generatedPassword && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">Choose Password Delivery Method:</Label>
                <RadioGroup value={resetOption} onValueChange={(value: string) => setResetOption(value as ResetOption)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="display" id="display" />
                    <Label htmlFor="display" className="flex items-center space-x-2 cursor-pointer">
                      <Eye className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Reset and Display Password</div>
                        <div className="text-sm text-muted-foreground">
                          New password will be shown to you for manual delivery
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center space-x-2 cursor-pointer">
                      <Mail className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Reset and Email Password</div>
                        <div className="text-sm text-muted-foreground">
                          New password will be automatically sent to user's email
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {generatedPassword && (
            <div className="space-y-3">
              <Label className="text-base font-medium text-green-600">New Password Generated:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={generatedPassword}
                  readOnly
                  className="font-mono text-gray-900 bg-white border-2 border-green-500 focus:border-green-600 dark:bg-gray-800 dark:text-gray-100 dark:border-green-400 font-semibold text-lg tracking-wider"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800">
                  <strong>Important:</strong> Please securely provide this password to the user. 
                  They will be required to change it on their next login.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            {generatedPassword ? 'Close' : 'Cancel'}
          </Button>
          {!generatedPassword && (
            <Button
              onClick={handleResetPassword}
              disabled={isPending}
              className="flex items-center space-x-1"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {resetOption === 'display' ? <Eye className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  <span>
                    {resetOption === 'display' ? 'Reset & Display' : 'Reset & Email'}
                  </span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
