import { getAdminStats, getPendingLawyers, getRecentSubscribers } from '@/lib/admin/api';
import { verifyLawyer, rejectLawyer } from './actions';

export const dynamic = 'force-dynamic';

function ErrorBanner({ message, source }: { message: string; source: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-4">
      <span className="text-lg">⚠️</span>
      <div>
        <strong>{source}: </strong>
        {message}
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const [statsResult, pendingResult, subscribersResult] = await Promise.all([
    getAdminStats(),
    getPendingLawyers(),
    getRecentSubscribers(),
  ]);

  const statsError = statsResult.error;
  const pendingError = pendingResult.error;
  const subscribersError = subscribersResult.error;
  const stats = statsResult.data ?? { totalLawyers: 0, verifiedLawyers: 0, pendingLawyers: 0, totalChambers: 0, totalSubscribers: 0, totalArticles: 0, totalPodcasts: 0 };
  const pendingLawyers = pendingResult.data ?? [];
  const recentSubscribers = subscribersResult.data ?? [];

  return (<>
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-gradient">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time monitoring and verification terminal for Lawyard v2.
            </p>
          </div>
        </header>

        {/* Error Banners */}
        {statsError && <ErrorBanner message={statsError.message} source="Stats" />}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-[#1E3A5F] before:to-[#C5A059] before:opacity-60">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Experts</span>
            <span className="text-3xl font-bold text-slate-900">{stats.totalLawyers}</span>
            <span className="text-xs text-emerald-500">Verified lawyers and scholars</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-[#1E3A5F] before:to-[#C5A059] before:opacity-60">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Review</span>
            <span className="text-3xl font-bold text-amber-600">{stats.pendingLawyers}</span>
            <span className="text-xs text-amber-600">Awaiting credential check</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-[#1E3A5F] before:to-[#C5A059] before:opacity-60">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Institutional Chambers</span>
            <span className="text-3xl font-bold text-slate-900">{stats.totalChambers}</span>
            <span className="text-xs text-emerald-500">Law practices listed</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-[#1E3A5F] before:to-[#C5A059] before:opacity-60">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Media Assets</span>
            <span className="text-3xl font-bold text-slate-900">{stats.totalArticles + stats.totalPodcasts}</span>
            <span className="text-xs text-emerald-500">{stats.totalArticles} articles • {stats.totalPodcasts} podcasts</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-[#1E3A5F] before:to-[#C5A059] before:opacity-60">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Newsletter Reach</span>
            <span className="text-3xl font-bold text-[#1E3A5F]">{stats.totalSubscribers}</span>
            <span className="text-xs text-[#1E3A5F]">Subscribed emails</span>
          </div>
        </section>

        {/* Main Grid Division */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          
          {/* Verification Pipeline */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {pendingError && <ErrorBanner message={pendingError.message} source="Pending Lawyers" />}
            <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-200">
              <h2>Verification Pipeline</h2>
              <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border border-amber-200">{pendingLawyers.length} Pending</span>
            </div>

            {pendingError ? (
              <div className="text-center py-9 px-5 text-slate-500 flex flex-col items-center gap-2.5">
                <span className="text-4xl">⚠️</span>
                <h3>Unable to Load</h3>
                <p className="text-sm max-w-[320px] text-red-600">
                  Could not fetch pending lawyers. Check your database connection.
                </p>
              </div>
            ) : pendingLawyers.length === 0 ? (
              <div className="text-center py-9 px-5 text-slate-500 flex flex-col items-center gap-2.5">
                <span className="text-4xl">✨</span>
                <h3>Pipeline Fully Vetted</h3>
                <p className="text-sm max-w-[320px]">
                  There are no lawyers or experts awaiting credential verification at this time.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingLawyers.map((lawyer) => (
                  <div key={lawyer.id} className="bg-slate-50 border border-slate-200 rounded-lg p-[18px] hover:border-[#1E3A5F] hover:shadow-sm transition">
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{lawyer.name}</h3>
                        <span className="text-[13px] text-slate-500">{lawyer.role || 'Legal Counsel'}</span>
                      </div>
                      <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border border-amber-200">Pending Review</span>
                    </div>

                    <div className="flex flex-wrap gap-3.5 text-[13px] text-slate-500 mb-3.5">
                      {lawyer.location && (
                        <span>
                          <strong>📍</strong> {lawyer.location}
                        </span>
                      )}
                      {lawyer.email && (
                        <span>
                          <strong>✉️</strong> {lawyer.email}
                        </span>
                      )}
                      {lawyer.phone && (
                        <span>
                          <strong>📞</strong> {lawyer.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2.5">
                      <form action={verifyLawyer} className="inline-block">
                        <input type="hidden" name="id" value={lawyer.id} />
                        <button type="submit" className="btn bg-emerald-500 text-white text-[13px] px-3.5 py-1.5 rounded-md hover:brightness-110 hover:-translate-y-0.5 transition">
                          Verify Profile
                        </button>
                      </form>
                      
                      <form action={rejectLawyer} className="inline-block">
                        <input type="hidden" name="id" value={lawyer.id} />
                        <button type="submit" className="btn bg-red-50 text-red-600 text-[13px] px-3.5 py-1.5 rounded-md border border-red-200 hover:bg-red-200 hover:-translate-y-0.5 transition">
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Newsletter Subscribers & Side Information */}
          <div className="flex flex-col gap-8">
            
            {/* Subscribers */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              {subscribersError && <ErrorBanner message={subscribersError.message} source="Subscribers" />}
              <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-200">
                <h2>Newsletter Subscribers</h2>
                <span className="text-sm text-slate-500">Recent</span>
              </div>

              {subscribersError ? (
                <p className="text-red-600 text-sm text-center py-5">
                  ⚠️ Could not load subscribers. Database may be unreachable.
                </p>
              ) : recentSubscribers.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-5">
                  No newsletter subscribers found.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentSubscribers.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition">
                      <span className="font-medium text-slate-900">{sub.email}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions / Integration */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="mb-4 text-lg">System Integration</h2>
              <p className="text-slate-400 text-sm mb-5">
                Quick controls for syncing content engines and publishing pipelines.
              </p>
              
              <div className="flex flex-col gap-3">
                <button className="btn btn-ghost justify-start w-full">
                  🔄 Sync LawyardAI Engine
                </button>
                <button className="btn btn-ghost justify-start w-full">
                  📨 Broadcast Weekly Digest
                </button>
              </div>
            </section>
          </div>
          
        </div>
  </>
  );
}
