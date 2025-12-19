import { useEffect, useState } from 'react';
import { GroupRound } from '@/lib/types/study-groups';

export function useRoundTimer(round: GroupRound | null) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  useEffect(() => {
    if (!round) {
      setTimeRemaining(0);
      return;
    }
    
    const { status, timingJson } = round;
    let duration = 0;
    
    switch (status) {
      case 'VOTING':
        duration = timingJson.voteSec;
        break;
      case 'DISCUSSING':
        duration = timingJson.discussSec;
        break;
      case 'REVOTING':
        duration = timingJson.revoteSec;
        break;
      case 'EXPLAINING':
        duration = timingJson.explainSec;
        break;
      default:
        duration = 0;
    }
    
    setTimeRemaining(duration);
    
    if (duration === 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [round?.status]);
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  return {
    timeRemaining,
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    isExpired: timeRemaining === 0,
  };
}
