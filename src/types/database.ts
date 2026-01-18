export interface Database {
  public: {
    Tables: {
      meetings: {
        Row: {
          id: string;
          meeting_uuid: string;
          rtms_stream_id: string | null;
          server_urls: string | null;
          host_id: string | null;
          host_name: string | null;
          topic: string | null;
          status: string;
          room_type: string;
          room_number: number | null;
          parent_meeting_id: string | null;
          icon_url: string | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_uuid: string;
          rtms_stream_id?: string | null;
          server_urls?: string | null;
          host_id?: string | null;
          host_name?: string | null;
          topic?: string | null;
          status?: string;
          room_type?: string;
          room_number?: number | null;
          parent_meeting_id?: string | null;
          icon_url?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_uuid?: string;
          rtms_stream_id?: string | null;
          server_urls?: string | null;
          host_id?: string | null;
          host_name?: string | null;
          topic?: string | null;
          status?: string;
          room_type?: string;
          room_number?: number | null;
          parent_meeting_id?: string | null;
          icon_url?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          meeting_id: string;
          participant_id: string;
          user_name: string | null;
          email: string | null;
          role: string | null;
          joined_at: string | null;
          left_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          participant_id: string;
          user_name?: string | null;
          email?: string | null;
          role?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          participant_id?: string;
          user_name?: string | null;
          email?: string | null;
          role?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          meeting_id: string;
          participant_id: string | null;
          speaker_name: string | null;
          content: string;
          timestamp_ms: number | null;
          sequence: number | null;
          is_final: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          participant_id?: string | null;
          speaker_name?: string | null;
          content: string;
          timestamp_ms?: number | null;
          sequence?: number | null;
          is_final?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          participant_id?: string | null;
          speaker_name?: string | null;
          content?: string;
          timestamp_ms?: number | null;
          sequence?: number | null;
          is_final?: boolean;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          meeting_id: string;
          participant_id: string | null;
          sender_name: string | null;
          message: string;
          message_type: string | null;
          recipient: string | null;
          timestamp_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          participant_id?: string | null;
          sender_name?: string | null;
          message: string;
          message_type?: string | null;
          recipient?: string | null;
          timestamp_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          participant_id?: string | null;
          sender_name?: string | null;
          message?: string;
          message_type?: string | null;
          recipient?: string | null;
          timestamp_ms?: number | null;
          created_at?: string;
        };
      };
      media_events: {
        Row: {
          id: string;
          meeting_id: string;
          event_type: string;
          participant_id: string | null;
          action: string;
          bytes_processed: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          event_type: string;
          participant_id?: string | null;
          action: string;
          bytes_processed?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          event_type?: string;
          participant_id?: string | null;
          action?: string;
          bytes_processed?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      prompt_configs: {
        Row: {
          id: string;
          scope: 'global' | 'room';
          room_number: number | null;
          name: string;
          prompt_text: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scope: 'global' | 'room';
          room_number?: number | null;
          name: string;
          prompt_text: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scope?: 'global' | 'room';
          room_number?: number | null;
          name?: string;
          prompt_text?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      external_contexts: {
        Row: {
          id: string;
          title: string;
          file_name: string;
          file_type: 'pdf' | 'docx' | 'txt';
          content: string;
          chunk_index: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          file_name: string;
          file_type: 'pdf' | 'docx' | 'txt';
          content: string;
          chunk_index?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          file_name?: string;
          file_type?: 'pdf' | 'docx' | 'txt';
          content?: string;
          chunk_index?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      analysis_summaries: {
        Row: {
          id: string;
          meeting_id: string | null;
          room_number: number;
          summary_type: 'room' | 'cross_room' | 'context_gap';
          content: string;
          sentiment_score: number;
          key_topics: string[];
          key_speakers: string[];
          action_items: string[];
          last_transcript_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id?: string | null;
          room_number: number;
          summary_type: 'room' | 'cross_room' | 'context_gap';
          content: string;
          sentiment_score?: number;
          key_topics?: string[];
          key_speakers?: string[];
          action_items?: string[];
          last_transcript_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string | null;
          room_number?: number;
          summary_type?: 'room' | 'cross_room' | 'context_gap';
          content?: string;
          sentiment_score?: number;
          key_topics?: string[];
          key_speakers?: string[];
          action_items?: string[];
          last_transcript_id?: string | null;
          created_at?: string;
        };
      };
      topic_nodes: {
        Row: {
          id: string;
          label: string;
          description: string | null;
          category: string | null;
          mention_count: number;
          room_mentions: Record<string, number>;
          importance_score: number;
          first_seen: string;
          last_seen: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          description?: string | null;
          category?: string | null;
          mention_count?: number;
          room_mentions?: Record<string, number>;
          importance_score?: number;
          first_seen?: string;
          last_seen?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          description?: string | null;
          category?: string | null;
          mention_count?: number;
          room_mentions?: Record<string, number>;
          importance_score?: number;
          first_seen?: string;
          last_seen?: string;
          created_at?: string;
        };
      };
      topic_edges: {
        Row: {
          id: string;
          source_node_id: string;
          target_node_id: string;
          relationship_type: 'related_to' | 'depends_on' | 'conflicts_with' | 'supports';
          weight: number;
          room_context: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_node_id: string;
          target_node_id: string;
          relationship_type?: 'related_to' | 'depends_on' | 'conflicts_with' | 'supports';
          weight?: number;
          room_context?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_node_id?: string;
          target_node_id?: string;
          relationship_type?: 'related_to' | 'depends_on' | 'conflicts_with' | 'supports';
          weight?: number;
          room_context?: Record<string, unknown>;
          created_at?: string;
        };
      };
      insight_events: {
        Row: {
          id: string;
          insight_type: 'alignment' | 'misalignment' | 'gap' | 'highlight' | 'action';
          severity: 'info' | 'warning' | 'alert';
          title: string;
          description: string;
          involved_rooms: number[];
          related_topics: string[];
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          insight_type: 'alignment' | 'misalignment' | 'gap' | 'highlight' | 'action';
          severity?: 'info' | 'warning' | 'alert';
          title: string;
          description: string;
          involved_rooms?: number[];
          related_topics?: string[];
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          insight_type?: 'alignment' | 'misalignment' | 'gap' | 'highlight' | 'action';
          severity?: 'info' | 'warning' | 'alert';
          title?: string;
          description?: string;
          involved_rooms?: number[];
          related_topics?: string[];
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      analysis_queue: {
        Row: {
          id: string;
          transcript_id: string;
          meeting_id: string;
          room_number: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          priority: number;
          retry_count: number;
          error_message: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          transcript_id: string;
          meeting_id: string;
          room_number?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          priority?: number;
          retry_count?: number;
          error_message?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          transcript_id?: string;
          meeting_id?: string;
          room_number?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          priority?: number;
          retry_count?: number;
          error_message?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
      };
      naming_templates: {
        Row: {
          id: string;
          name: string;
          template_pattern: string;
          description: string | null;
          is_default: boolean;
          category: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          template_pattern: string;
          description?: string | null;
          is_default?: boolean;
          category?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          template_pattern?: string;
          description?: string | null;
          is_default?: boolean;
          category?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Meeting = Database['public']['Tables']['meetings']['Row'];
export type Participant = Database['public']['Tables']['participants']['Row'];
export type Transcript = Database['public']['Tables']['transcripts']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type MediaEvent = Database['public']['Tables']['media_events']['Row'];
export type PromptConfig = Database['public']['Tables']['prompt_configs']['Row'];
export type ExternalContext = Database['public']['Tables']['external_contexts']['Row'];
export type AnalysisSummary = Database['public']['Tables']['analysis_summaries']['Row'];
export type TopicNode = Database['public']['Tables']['topic_nodes']['Row'];
export type TopicEdge = Database['public']['Tables']['topic_edges']['Row'];
export type InsightEvent = Database['public']['Tables']['insight_events']['Row'];
export type AnalysisQueueItem = Database['public']['Tables']['analysis_queue']['Row'];
export type NamingTemplate = Database['public']['Tables']['naming_templates']['Row'];
