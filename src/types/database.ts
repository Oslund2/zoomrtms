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
    };
  };
}

export type Meeting = Database['public']['Tables']['meetings']['Row'];
export type Participant = Database['public']['Tables']['participants']['Row'];
export type Transcript = Database['public']['Tables']['transcripts']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type MediaEvent = Database['public']['Tables']['media_events']['Row'];
