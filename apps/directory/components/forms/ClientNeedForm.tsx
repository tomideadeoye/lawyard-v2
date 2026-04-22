'use client';

import { useState } from 'react';
import styles from './Forms.module.css';
import { createClient } from '@/lib/supabase/client';

export default function ClientNeedForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const budget = formData.get('budget') as string;

    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to post a requirement.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('client_needs')
      .insert({
        user_id: user.id,
        title,
        description,
        location,
        budget_range: budget,
        status: 'open'
      });

    if (insertError) {
      console.error(insertError);
      setError(insertError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className={styles.successState}>
        <div className={styles.icon}>✅</div>
        <h3>Requirement Posted Successfully</h3>
        <p>Your legal need has been broadcast to the directory's vetted experts. You will receive notifications as they respond.</p>
        <button onClick={() => window.location.href = '/dashboard'} className="btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="title">Reason for consultation (Subject)</label>
        <input name="title" id="title" placeholder="e.g. Intellectual Property Dispute in Lagos" required />
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Detailed Description</label>
        <textarea name="description" id="description" rows={5} placeholder="Describe your legal situation in detail..." required />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="location">Location</label>
          <input name="location" id="location" placeholder="e.g. Lagos, Nigeria" />
        </div>
        <div className={styles.field}>
          <label htmlFor="budget">Budget Range</label>
          <select name="budget" id="budget">
            <option value="flexible">Flexible / Negotiable</option>
            <option value="low">Under $500</option>
            <option value="medium">$500 - $2,500</option>
            <option value="high">$2,500 - $10,000</option>
            <option value="premium">$10,000+</option>
          </select>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Processing...' : 'Broadcast Requirement'}
      </button>
    </form>
  );
}
