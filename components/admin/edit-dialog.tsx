'use client';

import { useRef } from 'react';
import { updateLawyer } from '@/app/admin/actions';

interface EditDialogProps {
  lawyer: { id: string; name: string; role: string; location: string };
}

export function EditLawyerDialog({ lawyer }: EditDialogProps) {
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
          padding: '32px', maxWidth: '420px', width: '90%',
          fontFamily: 'var(--font-sans)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Edit Lawyer</h3>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>

        <form action={updateLawyer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="hidden" name="id" value={lawyer.id} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Name
            </label>
            <input
              name="name" defaultValue={lawyer.name} required
              style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                color: '#0F172A', padding: '10px 14px', borderRadius: '8px',
                fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Role
            </label>
            <input
              name="role" defaultValue={lawyer.role}
              style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                color: '#0F172A', padding: '10px 14px', borderRadius: '8px',
                fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Location
            </label>
            <input
              name="location" defaultValue={lawyer.location}
              style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                color: '#0F172A', padding: '10px 14px', borderRadius: '8px',
                fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" onClick={() => dialogRef.current?.close()}>
              Save
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
