export type CustomerType = 'Fresh Lead' | 'Visited Customer' | 'Existing Customer';
export type LeadSource = 'YouTube' | 'Facebook' | 'Paid Advertisement' | 'Reference' | 'Calling' | 'Other sources' | string;
export type Profile = 'Govt Job' | 'Private Job' | 'Business' | 'Other';
export type Requirement = 'Investment' | 'Self Use' | 'Mix' | 'Rental';
export type PropertyType = 'Residential Plot' | 'Commercial Plot' | 'Industrial Plot' | 'Farmhouse' | 'Villa' | 'Shop' | 'Commercial Property' | 'Other' | string;
export type RoadSize = '30 ft' | '40 ft' | '50 ft' | '80 ft' | '100 ft' | '200 ft' | string;
export type Facing = 'East' | 'West' | 'North' | 'South' | 'Corner' | string;
export type Station = 'Jaipur' | 'Ajmer' | 'Bhiwadi' | 'Mumbai' | 'Other' | string;
export type LoanRequirement = 'No' | 'Minimum' | 'Max';
export type LeadStatus = 'Fresh' | 'Follow-up Today' | 'Site Visit' | 'Negotiation' | 'Deal Closed' | 'Lost';
export type DealStatus = 'Won' | 'Lost' | 'Pending';

export interface Lead {
  id: string; // UUID
  name: string;
  mobile: string;
  customer_type: CustomerType;
  source?: string;
  visited_location?: string;
  property_name?: string;
  address: string;
  district?: string;
  state?: string;
  profile: Profile;
  requirement: Requirement;
  budget: string;
  property_type: PropertyType;
  size: string; // Used for plot/property size
  road_size: string | string[];
  facing: string | string[];
  station?: string;
  location: string;
  loan_requirement: LoanRequirement;
  status: LeadStatus;
  created_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  comment: string;
  visit_date: string | null;
  next_follow_up_date: string | null;
  follow_up_time?: string | null;
  reminder_sent: boolean;
  is_initial?: boolean;
  created_at: string;
}

export interface Deal {
  id: string;
  lead_id: string;
  deal_date: string;
  property_size: string;
  location: string;
  deal_status: DealStatus;
  final_amount: number;
  created_at: string;
}

export type ActivityType = 'Lead Added' | 'Follow Up' | 'Site Visit' | 'Deal Completed';

export interface MarkActivity {
  id: string;
  userId: string;
  teamId?: string | null;
  leadId: string;
  leadName: string;
  activityType: ActivityType;
  points: number;
  timestamp: string; // ISO String
}

export type NotificationType = 
  | 'follow_up' 
  | 'lead_update' 
  | 'site_visit' 
  | 'deal_closed' 
  | 'team_update';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  leadId?: string | null;
  teamId?: string | null;
  createdAt: string; // ISO String
}

