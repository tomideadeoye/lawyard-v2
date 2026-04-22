'use client';

import { useState } from "react";
import styles from "./add-listing.module.css";
import ClientNeedForm from "../../components/forms/ClientNeedForm";

export default function AddListingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <main className={styles.main}>
       <div className={styles.onboardingHeader}>
          <div className={styles.steps}>
            <div className={`${styles.step} ${selectedCategory ? styles.completed : styles.active}`}>1. Category</div>
            <div className={`${styles.step} ${selectedCategory ? styles.active : ''}`}>2. Details</div>
            <div className={styles.step}>3. Verification</div>
            <div className={styles.step}>4. Capitalize</div>
          </div>
       </div>

        {!selectedCategory ? (
          <>
            <section className={styles.intro}>
              <h1>Join the <span className="gradient-text">Elite</span>.</h1>
              <p>The Lawyard Directory is a curated platform for top-tier legal talent. Start your application below.</p>
            </section>

            <section className={styles.selectionGrid}>
              <div className={styles.selectionCard}>
                <div className={styles.icon}>🎓</div>
                <h3>Individual Lawyer</h3>
                <p>For independent practitioners and legal engineers.</p>
                <button className="btn-primary" onClick={() => setSelectedCategory('lawyer')}>Select Individual</button>
              </div>

              <div className={styles.selectionCard}>
                <div className={styles.icon}>🏛️</div>
                <h3>Law Chamber / Firm</h3>
                <p>For established law firms and specialized chambers.</p>
                <button className="btn-primary" onClick={() => setSelectedCategory('chamber')}>Select Institution</button>
              </div>

              <div className={styles.selectionCard}>
                <div className={styles.icon}>💼</div>
                <h3>Corporate Legal Dept</h3>
                <p>For in-house teams seeking external specialists.</p>
                <button className="btn-primary" onClick={() => setSelectedCategory('corporate')}>Select Corporate</button>
              </div>

              <div className={styles.selectionCard}>
                <div className={styles.icon}>🎯</div>
                <h3>Post Client Need</h3>
                <p>For individuals or teams with specific legal requirements seeking experts.</p>
                <button className="btn-primary" onClick={() => setSelectedCategory('need')}>Post Requirement</button>
              </div>
            </section>
          </>
        ) : (
          <section className={styles.formContainer}>
            <button className={styles.backBtn} onClick={() => setSelectedCategory(null)}>← Back to Categories</button>
            
            <div className={styles.formHeader}>
              <h2>
                {selectedCategory === 'need' ? 'Tell us what you need.' : 'Complete your listing.'}
              </h2>
              <p>
                {selectedCategory === 'need' ? 
                  'Describe your situation so our vetted experts can contact you.' : 
                  'Our verification team will review your details once submitted.'}
              </p>
            </div>

            {selectedCategory === 'need' ? (
              <ClientNeedForm />
            ) : (
              <div className={styles.placeholderForm}>
                <p>The form for <strong>{selectedCategory}</strong> listings is being optimized for the Supabase protocol.</p>
                <button className="btn-primary" disabled>Coming Soon</button>
              </div>
            )}
          </section>
        )}

        {!selectedCategory && (
          <div className={styles.infoBox}>
            <h4>Why list with Lawyard?</h4>
            <ul>
              <li>Access to high-net-worth clients and corporate mandates.</li>
              <li>Verified status badge for enhanced professional trust.</li>
              <li>Direct integration with the Orion legal tech ecosystem.</li>
            </ul>
          </div>
        )}
      </main>
    );
}
