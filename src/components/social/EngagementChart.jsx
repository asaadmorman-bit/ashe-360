import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SectionPanel from '../shared/SectionPanel';
import { TrendingUp } from 'lucide-react';

export default function EngagementChart({ posts }) {
  const publishedPosts = posts
    .filter(p => p.status === 'published' && p.published_at)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 10);

  const chartData = publishedPosts.map((p, idx) => ({
    name: `Post ${publishedPosts.length - idx}`,
    Likes: p.engagement_likes || 0,
    Comments: p.engagement_comments || 0,
    Shares: p.engagement_shares || 0,
  }));

  const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.engagement_likes || 0), 0);
  const totalComments = publishedPosts.reduce((sum, p) => sum + (p.engagement_comments || 0), 0);
  const totalShares = publishedPosts.reduce((sum, p) => sum + (p.engagement_shares || 0), 0);
  const totalEngagement = totalLikes + totalComments + totalShares;

  return (
    <SectionPanel title="Engagement Comparison" icon={TrendingUp} className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Total Likes</p>
          <p className="text-2xl font-bold text-primary">{totalLikes}</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Total Comments</p>
          <p className="text-2xl font-bold text-accent">{totalComments}</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Total Shares</p>
          <p className="text-2xl font-bold text-chart-2">{totalShares}</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No published posts yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--foreground))',
              }}
              cursor={{ fill: 'rgba(0, 229, 200, 0.1)' }}
            />
            <Legend
              wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }}
              iconType="square"
            />
            <Bar dataKey="Likes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Comments" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Shares" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {publishedPosts.length > 0 && (
        <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground">
          <p>Showing latest {publishedPosts.length} published posts • Total engagement: <span className="text-foreground font-semibold">{totalEngagement}</span></p>
        </div>
      )}
    </SectionPanel>
  );
}