import Link from 'next/link';

export default function ComingSoon({ title, description }: { title: string, description: string }) {
  return (
    <div style={{ 
      minHeight: '70vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        fontSize: '4rem', 
        marginBottom: '1rem',
        animation: 'bounce 2s infinite'
      }}>🏗️</div>
      <h1 className="gradient-text">{title}</h1>
      <p style={{ 
        maxWidth: '500px', 
        opacity: 0.7, 
        marginTop: '1rem', 
        lineHeight: '1.6',
        fontSize: '1.1rem'
      }}>
        {description}
      </p>
      
      <div style={{ marginTop: '3rem' }}>
        <Link href="/" className="btn-primary">Return to Directory</Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
}
