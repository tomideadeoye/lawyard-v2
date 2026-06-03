import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.badge}>OUR MISSION</div>
          <h1>Architecting the <span className="gradient-text">New Legal Frontier</span>.</h1>
          <p className={styles.subtitle}>
            Lawyard is more than a directory. It is the infrastructure for Africa&apos;s elite legal talent, 
            connecting complex challenges with sophisticated solutions.
          </p>
        </section>

        <div className={styles.contentGrid}>
          <div className={styles.contentBlock}>
            <h2>Precision Discovery</h2>
            <p>
              We believe legal services should be discovered, not stumbled upon. 
              Our intelligent engine filters for mastery, ensuring that clients find the 
              exact expertise needed for their specific jurisdictional and sectoral requirements.
            </p>
          </div>
          
          <div className={styles.contentBlock}>
            <h2>Technology First</h2>
            <p>
              Built by an elite engineering team and powered by advanced systems, 
              we are integrating state-of-the-art automation and AI into the legal workflow, 
              starting with high-fidelity discovery.
            </p>
          </div>
        </div>

        <section className={styles.team}>
          <h2>The <span className="gradient-text">Architects</span></h2>
          <div className={styles.teamGrid}>
             <div className={styles.teamMember}>
               <h3>John Doe</h3>
               <p>Chief Legal Engineer</p>
             </div>
             <div className={styles.teamMember}>
               <h3>Technology Partner</h3>
               <p>Infrastructure & Architecture</p>
             </div>
          </div>
        </section>
      </main>
    );
}
