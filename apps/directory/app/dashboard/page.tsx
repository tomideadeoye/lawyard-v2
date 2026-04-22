import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import styles from './Dashboard.module.css'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  const user = data?.user

  if (error || !user) {
    redirect('/login')
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let initial = 'U'
  if (profile?.full_name?.[0]) {
    initial = profile.full_name[0]
  } else if (user?.email) {
    // @ts-ignore
    initial = user.email[0].toUpperCase()
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.banner} />
        <div className={styles.content}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {initial}
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
            <p className={styles.role}>{profile?.role?.toUpperCase() || 'EXPERT'} DASHBOARD</p>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <h3>Email</h3>
              <p>{user.email}</p>
            </div>
            <div className={styles.detailItem}>
              <h3>Account Status</h3>
              <p>Verified</p>
            </div>
            <div className={styles.detailItem}>
              <h3>Member Since</h3>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div className={styles.detailItem}>
              <h3>My Listings</h3>
              <p style={{ opacity: 0.5 }}>No active listings</p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <button className="btn-primary" style={{ width: '100%' }}>Add New Listing</button>
          </div>
        </div>
      </div>
    </div>
  )
}
