import { Lead, FollowUp, Deal } from '../models/types';


const generateId = () => Math.random().toString(36).substring(2, 15);
const today = new Date().toISOString().split('T')[0];

export const dummyLeads: Lead[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    customer_type: 'Fresh Lead',
    source: 'YouTube',
    address: 'Delhi NCR',
    profile: 'Business',
    requirement: 'Investment',
    budget: '50 Lacs',
    property_type: 'Residential Plot',
    size: '200',
    road_size: '40 ft, 50 ft',
    facing: 'East, North',
    station: 'Jaipur',
    location: 'Ajmer Road',
    loan_requirement: 'No',
    status: 'Fresh',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Amit Singh',
    mobile: '9123456789',
    customer_type: 'Visited Customer',
    visited_location: 'Sohna Road',
    property_name: 'Green Meadows Villa',
    address: 'Gurgaon',
    profile: 'Private Job',
    requirement: 'Self Use',
    budget: '1.2 Cr',
    property_type: 'Villa',
    size: '300',
    road_size: '50 ft, 80 ft',
    facing: 'North, Corner',
    station: 'Bhiwadi',
    location: 'Sohna Road',
    loan_requirement: 'Max',
    status: 'Follow-up Today',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Priya Sharma',
    mobile: '9988776655',
    customer_type: 'Existing Customer',
    address: 'Noida',
    profile: 'Govt Job',
    requirement: 'Mix',
    budget: '80 Lacs',
    property_type: 'Commercial Property',
    size: '500',
    road_size: '100 ft, 200 ft',
    facing: 'East, South, Corner',
    station: 'Mumbai',
    location: 'Sector 18',
    loan_requirement: 'Minimum',
    status: 'Deal Closed',
    created_at: new Date().toISOString(),
  },
];

export const dummyFollowUps: FollowUp[] = [
  {
    id: generateId(),
    lead_id: dummyLeads[0].id,
    comment: 'Customer is interested, wants to discuss further next week.',
    visit_date: null,
    next_follow_up_date: today,
    reminder_sent: false,
    created_at: new Date().toISOString()
  },
  {
    id: generateId(),
    lead_id: dummyLeads[1].id,
    comment: 'Site visit completed. Negotiation pending.',
    visit_date: '2026-08-11',
    next_follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    reminder_sent: false,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const dummyDeals: Deal[] = [
  {
    id: generateId(),
    lead_id: dummyLeads[2].id,
    deal_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    property_size: '200 Sq Yd',
    location: 'Sector 4, Gurgaon',
    deal_status: 'Won',
    final_amount: 10000000,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];
