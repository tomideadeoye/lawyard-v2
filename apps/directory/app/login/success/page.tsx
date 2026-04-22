import styles from './Success.module.css'
import Link from 'next/link'

export default function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = searchParams.email || 'your email'

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.header}>
          <h1 className="gradient-text">Registration Confirmation!</h1>
        </div>
        
        <div className={styles.content}>
          <div className={styles.icon}>✉️</div>
          <p className={styles.message}>
            The Lawyard Protocol has been initiated. We've sent a verification link to your inbox.
          </p>

          <div className={styles.info}>
            <p>
              Please verify <b>{email}</b> to complete your profile and access the directory dashboard.
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/login" className="btn-primary">
              Return to Login
            </Link>
            <button className={styles.resendBtn}>
              Didn't receive the email? Resend
            </button>
          </div>

          <p style={{ marginTop: '2.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            We look forward to seeing you soon.
          </p>
        </div>
      </div>
    </div>
  )
}
