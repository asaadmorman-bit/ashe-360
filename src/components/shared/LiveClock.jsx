import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-right">
      <div className="text-2xl font-bold text-foreground tracking-wider">
        {format(now, 'HH:mm:ss')}
      </div>
      <div className="text-sm text-muted-foreground">
        {format(now, 'EEEE, MMM d yyyy')} · EST
      </div>
    </div>
  );
}