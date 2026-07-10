'use client';

import { useRef } from 'react';
import { updateCoupon } from '../actions';

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number | null
  frequency_days: number | null
  max_uses: number | null
  description: string | null
}

export function EditCouponDialog({ coupon }: { coupon: Coupon }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: '5px 12px', fontSize: '0.75rem' }}
        onClick={() => dialogRef.current?.showModal()}
      >
        Edit
      </button>

      <dialog
        ref={dialogRef}
        style={{
          background: 'var(--card)', color: 'var(--foreground)',
          border: '1px solid var(--card-border)', borderRadius: '16px',
          padding: '32px', maxWidth: '440px', width: '90%',
          fontFamily: 'var(--font-sans)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Edit Coupon</h3>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>

        <form action={updateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input type="hidden" name="id" value={coupon.id} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Code</label>
            <input name="code" defaultValue={coupon.code} required className="input" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', fontSize: '0.9rem' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Discount Type</label>
            <select name="discount_type" defaultValue={coupon.discount_type} className="input" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', fontSize: '0.9rem' }}>
              <option value="free">Free</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Discount Value %</label>
            <input name="discount_value" defaultValue={coupon.discount_value ?? ''} type="number" min="1" max="100" className="input" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', fontSize: '0.9rem' }} />
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Max Uses</label>
              <input name="max_uses" defaultValue={coupon.max_uses ?? ''} type="number" min="1" className="input" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', fontSize: '0.9rem' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Frequency (days)</label>
              <input name="frequency_days" defaultValue={coupon.frequency_days ?? ''} type="number" min="1" className="input" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', fontSize: '0.9rem' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</label>
            <input name="description" defaultValue={coupon.description ?? ''} className="input" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', fontSize: '0.9rem' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button type="submit" className="btn btn-primary" onClick={() => dialogRef.current?.close()}>Save</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
