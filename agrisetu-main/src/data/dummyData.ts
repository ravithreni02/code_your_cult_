export interface Equipment {
  id: string;
  name: string;
  price: number;
  availability: boolean;
  image: string;
  owner: string;
}

export interface Labor {
  id: string;
  name: string;
  skill: string;
  wage: number;
  availability: boolean;
}

export interface GroupLabor {
  id: string;
  groupName: string;
  workers: number;
  price: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  text: string;
  image?: string;
  likes: number;
  comments: { author: string; text: string }[];
  timestamp: string;
}

export const equipmentData: Equipment[] = [
  { id: "1", name: "Tractor - Mahindra 575", price: 1500, availability: true, image: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=400&h=300&fit=crop", owner: "Rajesh Kumar" },
  { id: "2", name: "Rotavator", price: 800, availability: true, image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop", owner: "Suresh Patel" },
  { id: "3", name: "Seed Drill Machine", price: 600, availability: false, image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop", owner: "Amit Singh" },
  { id: "4", name: "Harvester Combine", price: 3000, availability: true, image: "https://images.unsplash.com/photo-1591086731385-07063aa3c5db?w=400&h=300&fit=crop", owner: "Vikram Yadav" },
  { id: "5", name: "Sprayer Pump", price: 400, availability: true, image: "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=400&h=300&fit=crop", owner: "Mohan Das" },
  { id: "6", name: "Plough Machine", price: 500, availability: true, image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&h=300&fit=crop", owner: "Kiran Reddy" },
];

export const laborData: Labor[] = [
  { id: "1", name: "Ramesh Verma", skill: "Harvesting", wage: 500, availability: true },
  { id: "2", name: "Sita Devi", skill: "Sowing", wage: 400, availability: true },
  { id: "3", name: "Gopal Sharma", skill: "Irrigation", wage: 600, availability: false },
  { id: "4", name: "Lakshmi Bai", skill: "Weeding", wage: 350, availability: true },
  { id: "5", name: "Bhola Nath", skill: "Ploughing", wage: 550, availability: true },
  { id: "6", name: "Kamla Devi", skill: "Transplanting", wage: 450, availability: true },
];

export const groupLaborData: GroupLabor[] = [
  { id: "1", groupName: "Kisan Majdoor Group", workers: 10, price: 4000 },
  { id: "2", groupName: "Shramik Sena", workers: 15, price: 5500 },
  { id: "3", groupName: "Gram Seva Dal", workers: 8, price: 3200 },
];

export const communityPosts: CommunityPost[] = [
  {
    id: "1",
    author: "Rajesh Kumar",
    text: "This season's wheat crop is looking great! Using organic fertilizers made a big difference. 🌾",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop",
    likes: 24,
    comments: [
      { author: "Suresh Patel", text: "Great work bhai! Which fertilizer did you use?" },
      { author: "Amit Singh", text: "Looking amazing! 👏" },
    ],
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    author: "Sita Devi",
    text: "Anyone knows a good remedy for aphids on mustard crop? Need help urgently.",
    likes: 8,
    comments: [
      { author: "Gopal Sharma", text: "Try neem oil spray, works very well." },
    ],
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    author: "Vikram Yadav",
    text: "Just bought a new Mahindra tractor! Available for rent in Jaipur district. Contact me.",
    image: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=600&h=400&fit=crop",
    likes: 45,
    comments: [
      { author: "Mohan Das", text: "What's the rent per day?" },
      { author: "Kiran Reddy", text: "Congratulations! 🎉" },
    ],
    timestamp: "1 day ago",
  },
];
