import { login, signup } from './actions'
import styles from './Login.module.css'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams;

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1 className="gradient-text">Welcome Back</h1>
          <p>Sign in to Lawyard Directory</p>
        </div>

        {searchParams.message && (
          <div className={styles.message}>
            {searchParams.message}
          </div>
        )}

        <form className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className={styles.actions}>
            <button
              formAction={login}
              className={styles.submitBtn}
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className={styles.secondaryBtn}
            >
              Create Account
            </button>
          </div>
        </form>

        <p style={{ 
          marginTop: '2rem', 
          fontSize: '0.75rem', 
          textAlign: 'center', 
          color: 'hsla(var(--foreground-hsl), 0.4)' 
        }}>
          By continuing, you agree to Lawyard's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
