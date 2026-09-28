export const COMPANY = "MERIDIAN BUILDS";

export const NAV = [
  { label: "HOME", href: "#home" },
  { label: "ABOUT", href: "#about" },
  { label: "SERVICES", href: "#services" },
  { label: "PROJECTS", href: "#projects" },
  { label: "3D EXPERIENCE", href: "#experience" },
  { label: "PROCESS", href: "#process" },
  { label: "TECHNOLOGY", href: "#technology" },
  { label: "CONTACT", href: "#contact" },
];

export type Service = { icon: string; title: string; text: string; hue: number };

export const SERVICES: Service[] = [
  { icon: "⌂", title: "Residential Construction", text: "Homes, villas and apartment communities built for comfort and longevity.", hue: 35 },
  { icon: "▦", title: "Commercial Construction", text: "Offices, retail and mixed-use blocks designed for performance.", hue: 212 },
  { icon: "⚙", title: "Industrial Construction", text: "Factories, warehouses and logistics facilities with heavy-duty specs.", hue: 12 },
  { icon: "◈", title: "Turnkey Projects", text: "One accountable team from concept and approvals to handover.", hue: 48 },
  { icon: "△", title: "Structural Engineering", text: "Efficient, safe structural systems validated with modern analysis.", hue: 200 },
  { icon: "✦", title: "Renovation & Remodeling", text: "Retrofits and upgrades that respect existing character.", hue: 340 },
  { icon: "═", title: "Infrastructure", text: "Roads, drainage, utilities and site development works.", hue: 120 },
  { icon: "☑", title: "Project Management", text: "Planning, cost control, QA/QC and transparent reporting.", hue: 260 },
];

export type Project = {
  name: string;
  location: string;
  category: string;
  year: number;
  hue: number;
  summary: string;
  area: string;
  scale: string;
  duration: string;
  system: string;
};

export const PROJECTS: Project[] = [
  {
    name: "Skyline Residences",
    location: "Coimbatore, Tamil Nadu",
    category: "Residential",
    year: 2026,
    hue: 35,
    summary: "A tall residential tower with sky gardens, a rooftop clubhouse and efficient floor plates for daylight and ventilation.",
    area: "3.2 lakh sq ft",
    scale: "G+28",
    duration: "34 months",
    system: "RCC frame",
  },
  {
    name: "Meridian Business Park",
    location: "Chennai, Tamil Nadu",
    category: "Commercial",
    year: 2025,
    hue: 210,
    summary: "An office campus with interconnected blocks, shaded glazing and a central landscaped court.",
    area: "6.5 lakh sq ft",
    scale: "G+12",
    duration: "30 months",
    system: "Steel-concrete composite",
  },
  {
    name: "Apex Logistics Hub",
    location: "Hosur, Tamil Nadu",
    category: "Industrial",
    year: 2024,
    hue: 15,
    summary: "A high-bay warehouse and distribution centre with wide clear heights and efficient dock circulation.",
    area: "4.8 lakh sq ft",
    scale: "Single level",
    duration: "16 months",
    system: "Pre-engineered steel",
  },
  {
    name: "Riverbend Corridor Link",
    location: "Tiruppur, Tamil Nadu",
    category: "Infrastructure",
    year: 2025,
    hue: 150,
    summary: "A multi-kilometre urban corridor with flyovers, drains and utility ducts delivered under live traffic.",
    area: "6.4 km",
    scale: "2 flyovers",
    duration: "26 months",
    system: "Roadway & bridges",
  },
  {
    name: "Heritage House Revival",
    location: "Coonoor, Tamil Nadu",
    category: "Renovation",
    year: 2023,
    hue: 350,
    summary: "Careful restoration of a heritage estate into a boutique stay, with seismic retrofit hidden in the fabric.",
    area: "28,000 sq ft",
    scale: "G+2",
    duration: "14 months",
    system: "Retrofit & restoration",
  },
  {
    name: "Aurum Villas",
    location: "Bengaluru, Karnataka",
    category: "Residential",
    year: 2024,
    hue: 55,
    summary: "A gated villa community with climate-responsive envelopes, courtyards and smart-home readiness.",
    area: "2.1 lakh sq ft",
    scale: "G+2",
    duration: "22 months",
    system: "RCC & masonry",
  },
];

export const CATEGORIES = ["ALL", "RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INFRASTRUCTURE", "RENOVATION"];

export const STEPS = [
  ["Consultation", "We align on vision, budget, site constraints and programme."],
  ["Site Analysis", "Surveys, soil study and feasibility before a line is drawn."],
  ["Architectural Design", "Concept to detailed drawings with 3D design reviews."],
  ["Structural Engineering", "Analysis, optimisation and buildable detailing."],
  ["Approvals", "Statutory clearances and liaison, handled systematically."],
  ["Construction", "Sequenced execution with model-led coordination on site."],
  ["Quality Inspection", "Staged checks, testing, audits and snag closure."],
  ["Project Handover", "Documentation, training and after-care support."],
];

export const TECH = [
  ["BIM", "Coordinated digital models"],
  ["3D Visualization", "Photoreal design review"],
  ["Structural Analysis", "Model-based simulation"],
  ["Drone Monitoring", "Aerial progress capture"],
  ["Smart Systems", "IoT-ready infrastructure"],
  ["Digital PM", "Live dashboards"],
  ["Sustainable Build", "Low-carbon materials"],
  ["Advanced Survey", "Laser & GNSS control"],
];

export const WHY = [
  ["Quality First", "Materials and workmanship verified at every stage."],
  ["Engineering Precision", "Tolerances measured on site, not assumed."],
  ["Advanced Technology", "Models, drones and digital oversight by default."],
  ["Safety", "Zero-compromise permits, training and edge protection."],
  ["Transparency", "Open costs and scheduled progress reporting."],
  ["On-Time Delivery", "Programmes we commit to and track weekly."],
  ["Sustainability", "Efficient envelopes and responsible sourcing."],
  ["Experienced Team", "Architects and engineers with decades on site."],
];

export const TESTIMONIALS = [
  {
    name: "Rajesh Menon",
    role: "Managing Director, Menon Developers",
    quote: "A 28-storey tower delivered ahead of schedule with finishing quality our buyers noticed immediately.",
  },
  {
    name: "Priya Natarajan",
    role: "Head of Facilities, Meridian Corp",
    quote: "Clear communication throughout. The progress dashboard gave our board complete confidence.",
  },
  {
    name: "Arun Krishnan",
    role: "Operations Director, Apex Logistics",
    quote: "Handed over on the promised date, on budget, and built to a measurable standard.",
  },
  {
    name: "Lakshmi Iyer",
    role: "Owner, Heritage House",
    quote: "They blended modern structural safety with the original character of our estate.",
  },
];

export const HOTSPOTS = [
  { id: "sail", label: "SAIL", title: "Sail membrane", text: "Tensioned fabric skin stretched between the twin masts, glowing after dark." },
  { id: "helipad", label: "HELIPAD", title: "Sky helipad", text: "Cantilevered landing deck with safety rail, hung off the sea face." },
  { id: "mast", label: "MAST", title: "Crown mast", text: "Slender spire rising above the sail, capped with an aircraft beacon." },
  { id: "island", label: "ISLAND", title: "Private island", text: "Reclaimed island with breakwater ring, palms, podium and causeway to shore." },
];

export function artBg(hue: number) {
  const angle = 30 + (hue % 60);
  return `repeating-linear-gradient(${angle}deg, rgba(24,16,17,.07) 0 1px, transparent 1px 22px), repeating-linear-gradient(${(angle + 90) % 180}deg, rgba(24,16,17,.05) 0 1px, transparent 1px 26px), #ffffff`;
}
