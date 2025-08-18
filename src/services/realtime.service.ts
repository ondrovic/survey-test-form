import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeEvent<T = any> {
  eventType: RealtimeEventType;
  new?: T;
  old?: T;
  errors?: string[];
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
  channel: RealtimeChannel;
}

export class RealtimeService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  constructor(private supabase: SupabaseClient) {}

  // Subscribe to survey response updates for real-time dashboard
  subscribeSurveyResponses(
    instanceId?: string,
    callback?: (event: RealtimeEvent) => void
  ): RealtimeSubscription {
    const channelName = instanceId ? `survey-responses:${instanceId}` : 'survey-responses:all';
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_responses',
          ...(instanceId && { filter: `survey_instance_id=eq.${instanceId}` })
        },
        (payload) => {
          if (callback) {
            callback({
              eventType: payload.eventType as RealtimeEventType,
              new: payload.new,
              old: payload.old,
              errors: payload.errors
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      unsubscribe: () => this.unsubscribe(channelName),
      channel
    };
  }

  // Subscribe to survey instance status changes
  subscribeSurveyInstanceStatusChanges(
    callback?: (event: RealtimeEvent) => void
  ): RealtimeSubscription {
    const channelName = 'survey-instance-status-changes';
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_instance_status_changes'
        },
        (payload) => {
          if (callback) {
            callback({
              eventType: payload.eventType as RealtimeEventType,
              new: payload.new,
              old: payload.old,
              errors: payload.errors
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      unsubscribe: () => this.unsubscribe(channelName),
      channel
    };
  }

  // Subscribe to survey config changes for live admin updates
  subscribeSurveyConfigs(
    callback?: (event: RealtimeEvent) => void
  ): RealtimeSubscription {
    const channelName = 'survey-configs';
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_configs'
        },
        (payload) => {
          if (callback) {
            callback({
              eventType: payload.eventType as RealtimeEventType,
              new: payload.new,
              old: payload.old,
              errors: payload.errors
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      unsubscribe: () => this.unsubscribe(channelName),
      channel
    };
  }

  // Subscribe to survey instances for live admin updates
  subscribeSurveyInstances(
    callback?: (event: RealtimeEvent) => void
  ): RealtimeSubscription {
    const channelName = 'survey-instances';
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_instances'
        },
        (payload) => {
          if (callback) {
            callback({
              eventType: payload.eventType as RealtimeEventType,
              new: payload.new,
              old: payload.old,
              errors: payload.errors
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      unsubscribe: () => this.unsubscribe(channelName),
      channel
    };
  }

  // Subscribe to presence for collaborative features (future use)
  subscribePresence(
    room: string,
    userInfo: Record<string, any>,
    callbacks?: {
      onJoin?: (key: string, currentPresences: any, newPresences: any) => void;
      onLeave?: (key: string, currentPresences: any, leftPresences: any) => void;
      onSync?: () => void;
    }
  ): RealtimeSubscription {
    const channelName = `presence:${room}`;
    
    const channel = this.supabase
      .channel(channelName, {
        config: {
          presence: {
            key: userInfo.id || 'anonymous'
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        callbacks?.onSync?.();
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
        callbacks?.onJoin?.(key, currentPresences, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
        callbacks?.onLeave?.(key, currentPresences, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userInfo);
        }
      });

    this.subscriptions.set(channelName, channel);

    return {
      unsubscribe: () => this.unsubscribe(channelName),
      channel
    };
  }

  // Subscribe to custom broadcast messages
  subscribeBroadcast<T = any>(
    room: string,
    eventName: string,
    callback: (payload: T) => void
  ): RealtimeSubscription {
    const channelName = `broadcast:${room}`;
    
    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: eventName }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      unsubscribe: () => this.unsubscribe(channelName),
      channel
    };
  }

  // Send broadcast message
  async sendBroadcast<T = any>(
    room: string,
    eventName: string,
    payload: T
  ): Promise<void> {
    const channelName = `broadcast:${room}`;
    let channel = this.subscriptions.get(channelName);

    if (!channel) {
      // Create temporary channel for sending
      channel = this.supabase.channel(channelName);
      await new Promise((resolve) => {
        channel!.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(void 0);
          }
        });
      });
    }

    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload
    });
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    for (const [channelName, channel] of this.subscriptions.entries()) {
      this.supabase.removeChannel(channel);
    }
    this.subscriptions.clear();
  }

  // Get active subscriptions
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // Check connection status
  getConnectionStatus(): 'CONNECTING' | 'OPEN' | 'CLOSED' {
    // This would depend on Supabase's internal connection status
    return 'OPEN'; // Simplified for now
  }

  // Helper method to create a combined subscription for survey dashboard
  createSurveyDashboardSubscription(
    instanceId: string,
    callbacks: {
      onNewResponse?: (response: any) => void;
      onStatusChange?: (change: any) => void;
      onConfigUpdate?: (config: any) => void;
    }
  ): () => void {
    const subscriptions: RealtimeSubscription[] = [];

    // Subscribe to responses
    if (callbacks.onNewResponse) {
      subscriptions.push(
        this.subscribeSurveyResponses(instanceId, (event) => {
          if (event.eventType === 'INSERT' && callbacks.onNewResponse) {
            callbacks.onNewResponse(event.new);
          }
        })
      );
    }

    // Subscribe to status changes
    if (callbacks.onStatusChange) {
      subscriptions.push(
        this.subscribeSurveyInstanceStatusChanges((event) => {
          if (event.new?.instance_id === instanceId && callbacks.onStatusChange) {
            callbacks.onStatusChange(event.new);
          }
        })
      );
    }

    // Subscribe to config updates
    if (callbacks.onConfigUpdate) {
      subscriptions.push(
        this.subscribeSurveyConfigs((event) => {
          if (callbacks.onConfigUpdate) {
            callbacks.onConfigUpdate(event.new);
          }
        })
      );
    }

    // Return unsubscribe function
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }
}

// Global realtime service instance
let realtimeService: RealtimeService | null = null;

// Initialize realtime service
export function initializeRealtimeService(supabase: SupabaseClient): RealtimeService {
  realtimeService = new RealtimeService(supabase);
  return realtimeService;
}

// Get realtime service instance
export function getRealtimeService(): RealtimeService {
  if (!realtimeService) {
    throw new Error('Realtime service not initialized. Call initializeRealtimeService() first.');
  }
  return realtimeService;
}

// Check if realtime service is initialized
export function isRealtimeServiceInitialized(): boolean {
  return realtimeService !== null;
}