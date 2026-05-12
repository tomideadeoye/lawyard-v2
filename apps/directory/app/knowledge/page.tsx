import Link from 'next/link';

const CATEGORIES = [
  { id: 'documentation', title: 'How to use', desc: 'Documentation for site guests.' },
  { id: 'clients', title: 'For Clients', desc: 'Guides for those in need of legal services.' },
  { id: 'lawyers', title: 'For Lawyers', desc: 'Manage your profile and listings.' },
  { id: 'chambers', title: 'For Chambers', desc: 'Case management and listing tips.' },
];

export default function KnowledgeBase() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-black mb-12">Knowledge Base</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CATEGORIES.map(cat => (
          <Link key={cat.id} href={`/knowledge/category/${cat.id}`} className="premium-card hover:border-accent transition-all">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{cat.desc}</p>
            <span className="text-primary font-bold">All articles →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}