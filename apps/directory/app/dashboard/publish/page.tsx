import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { publishArticle, publishPodcast } from '../../actions/content';
import styles from '../Dashboard.module.css';

export default async function PublishPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className={styles.container}>
      <div className="section-header">
        <h1 className="gradient-text">Content Studio</h1>
        <p>Publish insights, articles, and podcasts to the Lawyard Directory.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Article Form */}
        <div className="premium-card">
          <h3>✍️ Publish Article</h3>
          <form action={publishArticle} className="form-stack" style={{ marginTop: '1rem' }}>
            <input name="title" type="text" placeholder="Article Title" className="input-field" required />
            <input name="slug" type="text" placeholder="Slug (e.g. law-tech-nigeria)" className="input-field" required />
            <textarea name="content" placeholder="Write your content here..." className="input-field" style={{ height: '200px' }} required></textarea>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Publish to Directory</button>
          </form>
        </div>

        {/* Podcast Form */}
        <div className="premium-card">
          <h3>🎙️ Publish Podcast</h3>
          <form action={publishPodcast} className="form-stack" style={{ marginTop: '1rem' }}>
            <input name="title" type="text" placeholder="Podcast Title" className="input-field" required />
            <input name="media_url" type="text" placeholder="Media URL (Audio/Video Link)" className="input-field" required />
            <select name="media_type" className="input-field">
              <option value="audio">Audio Podcast</option>
              <option value="video">Video Podcast</option>
            </select>
            <textarea name="description" placeholder="Short description..." className="input-field"></textarea>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Go Live on Homepage</button>
          </form>
        </div>
      </div>
    </div>
  );
}