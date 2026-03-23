import React, { useEffect } from 'react';

let scopeMounters = 0;

export function AppAuthScope({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    scopeMounters++;
    document.documentElement.classList.add('app-auth');

    return () => {
      scopeMounters--;
      if (scopeMounters === 0) {
        document.documentElement.classList.remove('app-auth');
      }
    };
  }, []);

  return <>{children}</>;
}
