export type CustomerType = 'Fresh Lead' | 'Visited Customer' | 'Existing Customer';
export type Profile = 'Govt Job' | 'Private Job' | 'Business' | 'Other';
export type Requirement = 'Investment' | 'Self Use' | 'Mix';
export type PropertyType = 'Plot' | 'Villa' | 'Shop' | 'Farmhouse' | 'Commercial';
export type Facing = 'East' | 'West' | 'North' | 'South' | 'Corner' | 'Any';
export type LoanRequirement = 'No' | 'Minimum' | 'Max';
export type LeadStatus = 'Fresh' | 'Follow-up Today' | 'Site Visit' | 'Negotiation' | 'Deal Closed' | 'Lost';
export type DealStatus = 'Won' | 'Lost' | 'Pending';

export interface Lead {
  id: string; // UUID
  name: string;
  mobile: string;
  customer_type: CustomerType;
  address: string;
  district?: string;
  state?: string;
  profile: Profile;
  requirement: Requirement;
  budget: string;
  property_type: PropertyType;
  size: string; // Used for plot/property size
  road_size: string;
  facing: Facing;
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
  reminder_sent: boolean;
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
