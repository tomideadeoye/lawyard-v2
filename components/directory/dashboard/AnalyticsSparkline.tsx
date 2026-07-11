'use client';

interface Props {
  data: { date: string; count: number }[];
}

export default function AnalyticsSparkline({ data }: Props) {
  const max = Math.max(...data.map(d => d.count), 1);
  // Last 14 days
  const bars: number[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const match = data.find(p => p.date === key);
    bars.push(match ? match.count : 0);
  }

  if (bars.every(b => b === 0)) {
    return <div className="text-[10px] text-muted-foreground/50">No data yet</div>;
  }

  return (
    <div className="flex items-end gap-[2px] h-full">
      {bars.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-[1px] bg-accent/30"
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
          title={`${v} views`}
        />
      ))}
    </div>
  );
}
