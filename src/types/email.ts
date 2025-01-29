export interface EmailRequest {
  id: string;
  type: 'booking' | 'support' | 'general';
  status: 'pending' | 'resolved' | 'archived';
  sender_name: string;
  sender_email: string;
  subject: string;
  message_id: string;
  raw_content: string;
  parsed_intent?: string;
  parsed_details?: Record<string, any>;
  summary?: string;
  assigned_to?: string;
  business_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmailResponse {
  id: string;
  email_request_id: string;
  type: 'manual' | 'ai' | 'template';
  content: string;
  sent_by: string;
  created_at: string;
}

export type EmailRequestType = EmailRequest['type'];
export type EmailRequestStatus = EmailRequest['status'];
export type EmailResponseType = EmailResponse['type'];

export interface EmailConfiguration {
  id: string;
  business_id: string;
  email_address: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
