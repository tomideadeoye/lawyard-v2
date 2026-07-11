'use client';

import { useEffect } from 'react';
import { trackProfileView } from '@/app/directory/actions/analytics';

export default function ProfileViewTracker({ lawyerId }: { lawyerId: string }) {
  useEffect(() => {
    trackProfileView(lawyerId);
  }, [lawyerId]);

  return null;
}
