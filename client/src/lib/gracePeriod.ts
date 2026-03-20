

  export function calculateGracePeriodMinutes (totalTaskSeconds: number,percentage: number) {
    const rawSeconds = totalTaskSeconds * 60 * percentage;
    if (rawSeconds < 60) {
      
      return Math.max(1, Math.round(rawSeconds)) / 60;
    }
  
    return Math.max(1, Math.round(rawSeconds / 60));
  };

  export function formatGraceLabel(minutes: number)  {
    const secs = Math.round(minutes * 60);
    if (secs < 60) return `+${secs}s`;
    return `+${Math.round(secs / 60)}m`;
  };


