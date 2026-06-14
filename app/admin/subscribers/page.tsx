import { getSubscribers } from '@/lib/admin/subscribers';
import SubscribersClientPage from './subscribers-client';

export const dynamic = 'force-dynamic';

export default async function SubscribersPage() {
  const result = await getSubscribers();
  const subscribers = result.data || [];

  return <SubscribersClientPage subscribers={subscribers} />;
}
