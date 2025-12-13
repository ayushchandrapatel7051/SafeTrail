import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { emergencyApi } from '@/lib/api';

interface SOSButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function SOSButton({
  variant = 'destructive',
  size = 'default',
  className,
}: SOSButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const triggerSOS = async () => {
    setIsSending(true);

    try {
      // Get current location with longer timeout and fallback
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // Increased to 15 seconds
          maximumAge: 60000, // Accept cached position up to 1 minute old
        });
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      // Send SOS alert
      const response = await emergencyApi.triggerSOS({
        location,
        message: 'Emergency! I need immediate help!',
      });

      toast.success(`🚨 SOS Alert sent to ${response.contactsNotified} emergency contact(s)!`, {
        duration: 5000,
      });
      setIsConfirmOpen(false);
    } catch (error: unknown) {
      console.error('SOS error:', error);

      // Handle geolocation-specific errors
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              'Location access denied. Please enable location permissions in your browser settings and try again.',
              { duration: 6000 }
            );
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error(
              'Location information unavailable. Please check your GPS/internet connection.',
              { duration: 6000 }
            );
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out. Trying again with lower accuracy...', {
              duration: 4000,
            });
            // Retry with lower accuracy
            setTimeout(() => retryWithLowerAccuracy(), 1000);
            return; // Don't set isSending to false yet
          default:
            toast.error(
              'Failed to get your location. Please ensure location services are enabled.',
              { duration: 6000 }
            );
        }
      } else if (error instanceof Error) {
        toast.error(error.message || 'Failed to send SOS alert', { duration: 6000 });
      } else {
        toast.error('Failed to send SOS alert. Please call emergency services directly at 911.', {
          duration: 6000,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  // Fallback function with lower accuracy requirements
  const retryWithLowerAccuracy = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Use lower accuracy
          timeout: 10000,
          maximumAge: 300000, // Accept cached position up to 5 minutes old
        });
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      // Send SOS alert
      const response = await emergencyApi.triggerSOS({
        location,
        message: 'Emergency! I need immediate help!',
      });

      toast.success(
        `🚨 SOS Alert sent to ${response.contactsNotified} emergency contact(s)! (Using approximate location)`,
        {
          duration: 5000,
        }
      );
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Retry SOS error:', error);
      toast.error('Unable to determine location. Please call emergency services directly at 911.', {
        duration: 8000,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsConfirmOpen(true)}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        SOS Emergency
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Trigger SOS Alert?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              This will immediately notify all your emergency contacts via email with your current
              location.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold">What happens next:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Your emergency contacts will receive an email alert</li>
                <li>Your current location will be shared via Google Maps link</li>
                <li>Alert will be logged in your emergency history</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>📍 Location Tips:</strong> Make sure location services are enabled. The
                system will try high accuracy first, then fall back to approximate location if
                needed.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              If this is a life-threatening emergency, call 911 immediately.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={triggerSOS} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send SOS Alert'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
