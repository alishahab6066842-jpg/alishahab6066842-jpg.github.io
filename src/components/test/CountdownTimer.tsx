import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CountdownTimerProps {
  endTime: string;
  onExpire: () => void;
}

export const CountdownTimer = ({ endTime, onExpire }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0 && !expired) {
        setExpired(true);
        onExpire();
        return 0;
      }

      return Math.max(0, difference);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire, expired]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const isLowTime = timeLeft < 5 * 60 * 1000 && timeLeft > 0;

  return (
    <Card className={`p-4 sticky top-4 ${isLowTime ? 'border-destructive' : ''}`}>
      <div className="flex items-center gap-3">
        <Clock className={`h-5 w-5 ${isLowTime ? 'text-destructive' : 'text-primary'}`} />
        <div>
          <p className="text-sm text-muted-foreground">Time Remaining</p>
          <p className={`text-2xl font-bold ${isLowTime ? 'text-destructive' : ''}`}>
            {expired ? '00:00:00' : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
          </p>
        </div>
      </div>
      {isLowTime && !expired && (
        <p className="text-sm text-destructive mt-2">⚠️ Less than 5 minutes remaining!</p>
      )}
      {expired && (
        <p className="text-sm text-destructive mt-2">⏰ Time expired - submitting automatically</p>
      )}
    </Card>
  );
};
