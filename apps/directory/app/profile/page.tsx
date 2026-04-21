import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import styles from './Profile.module.css'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.banner} />
        <div className={styles.content}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {profile?.full_name?.[0] || user.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className={styles.actions}>
              <button className={styles.editBtn}>Edit Profile</button>
              <form action={signOut}>
                <button className={styles.logoutBtn}>Sign Out</button>
              </form>
            </div>
          </div>

          <div className={styles.info}>
            <h1 className="gradient-text">{profile?.full_name || 'Anonymous User'}</h1>
            <p className={styles.role}>{profile?.role?.toUpperCase() || 'CLIENT'}</p>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <h3>Email</h3>
              <p>{user.email}</p>
            </div>
            <div className={styles.detailItem}>
              <h3>User ID</h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>{user.id}</p>
            </div>
            <div className={styles.detailItem}>
              <h3>Account Status</h3>
              <p>Active</p>
            </div>
            <div className={styles.detailItem}>
              <h3>Member Since</h3>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
