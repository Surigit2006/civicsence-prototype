export type UserRole = 'citizen' | 'admin';

export type IssueStatus = 'Pending' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  createdAt?: string;
}

export interface Issue {
  id: number;
  user_id: number;
  username?: string;
  title: string;
  category: string;
  description: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  street_name: string;
  landmark: string;
  status: IssueStatus;
  admin_response?: string | null;
  responded_at?: string | null;
  responded_by?: number | null;
  responder_username?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

