import { Lead, FollowUp, Deal } from '../models/types';
import { v4 as uuidv4 } from 'uuid'; // need to install uuid or just use random string

const generateId = () => Math.random().toString(36).substring(2, 15);
const today = new Date().toISOString().split('T')[0];

export const dummyLeads: Lead[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    customer_type: 'Fresh Lead',
    address: 'Delhi NCR',
    profile: 'Business',
    requirement: 'Investment',
    budget: '50 Lacs',
    property_type: 'Plot',
    size: '200',
    road_size: '40ft',
    facing: 'East',
    location: 'Sector 62',
    loan_requirement: 'No',
    status: 'Fresh',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Amit Singh',
    mobile: '9123456789',
    customer_type: 'Visited Customer',
    address: 'Gurgaon',
    profile: 'Private Job',
    requirement: 'Self Use',
    budget: '1.2 Cr',
    property_type: 'Villa',
    size: '300',
    road_size: '60ft',
    facing: 'North',
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
    property_type: 'Commercial',
    size: '500',
    road_size: '100ft',
    facing: 'Corner',
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
    next_follow_up_date: today,
    reminder_sent: false,
    created_at: new Date().toISOString()
  },
  {
    id: generateId(),
    lead_id: dummyLeads[1].id,
    comment: 'Site visit completed. Negotiation pending.',
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
