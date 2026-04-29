import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Share2, Linkedin, Instagram, Mail, Send, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import SectionPanel from '../components/shared/SectionPanel';
import { StatusBadge } from '../components/shared/DataTable';
import EngagementChart from '../components/social/EngagementChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function PostCard({ post }) {
  const platformIcon = post.platform === 'linkedin' ? Linkedin : Instagram;
  const Icon = platformIcon;
  return (
    <div className="glass-panel rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium capitalize text-foreground">{post.platform}</span>
        </div>
        <StatusBadge status={post.status} />
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.engagement_likes || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.engagement_comments || 0}</span>
        <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {post.engagement_shares || 0}</span>
      </div>
      {post.published_at && (
        <p className="text-xs text-muted-foreground/60">{format(new Date(post.published_at), 'MMM d, h:mm a')}</p>
      )}
    </div>
  );
}

function ComposePost() {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: (data) => base44.entities.SocialPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setContent('');
    },
  });

  return (
    <SectionPanel title="Compose Post" icon={Send}>
      <div className="space-y-4">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-48 bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Write your post content..."
          value={content}
          onChange={e => setContent(e.target.value)}
          className="bg-secondary/50 border-border/50 min-h-[120px] text-base"
        />
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => createPost.mutate({ platform, content, status: 'draft' })}
            disabled={!content.trim() || createPost.isPending}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => createPost.mutate({ platform, content, status: 'published', published_at: new Date().toISOString() })}
            disabled={!content.trim() || createPost.isPending}
            className="bg-primary text-primary-foreground"
          >
            <Send className="w-4 h-4 mr-2" /> Publish
          </Button>
        </div>
      </div>
    </SectionPanel>
  );
}

export default function Social() {
  const { data: posts = [] } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => base44.entities.SocialPost.list('-created_date', 50),
    initialData: [],
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['email-inbox'],
    queryFn: () => base44.entities.EmailThread.list('-created_date', 30),
    initialData: [],
  });

  const linkedinPosts = posts.filter(p => p.platform === 'linkedin');
  const instagramPosts = posts.filter(p => p.platform === 'instagram');

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="Social" subtitle="Social Media & Communications Hub" icon={Share2} />

      <EngagementChart posts={posts} />

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn ({linkedinPosts.length})</TabsTrigger>
          <TabsTrigger value="instagram">Instagram ({instagramPosts.length})</TabsTrigger>
          <TabsTrigger value="inbox">Gmail Inbox ({emails.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <ComposePost />
        </TabsContent>

        <TabsContent value="linkedin">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedinPosts.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-10">No LinkedIn posts yet</p>}
            {linkedinPosts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        </TabsContent>

        <TabsContent value="instagram">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instagramPosts.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-10">No Instagram posts yet</p>}
            {instagramPosts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        </TabsContent>

        <TabsContent value="inbox">
          <SectionPanel title="Gmail Inbox" icon={Mail}>
            {emails.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No emails synced. Connect Gmail to view your inbox.</p>
            ) : (
              <div className="space-y-2">
                {emails.map(e => (
                  <div key={e.id} className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${e.is_read ? 'bg-secondary/20' : 'bg-secondary/50 border-l-2 border-primary'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-${e.is_read ? 'normal' : 'bold'} text-foreground`}>{e.from_name || e.from_email}</span>
                        {!e.is_read && <Badge className="bg-primary/20 text-primary text-xs">New</Badge>}
                      </div>
                      <p className="text-sm text-foreground truncate">{e.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.snippet}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {e.received_at ? format(new Date(e.received_at), 'MMM d') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}