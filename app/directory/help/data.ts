export interface HelpArticle {
  title: string;
  slug: string;
}

export interface HelpCategory {
  name: string;
  articles: HelpArticle[];
}

export interface ArticleContent {
  title: string;
  category: string;
  content: string[];
}

export const KB_CATEGORIES: HelpCategory[] = [
  {
    name: "Documentation (How to use)",
    articles: [{ title: "How to use this site", slug: "how-to-use-this-site" }],
  },
  {
    name: "For Clients",
    articles: [
      { title: "How to use this site", slug: "how-to-use-this-site-client" },
      { title: "Creating a profile", slug: "creating-a-profile" },
      { title: "Guest dashboard", slug: "guest-dashboard" },
      { title: "Searching and finding lawyers", slug: "searching-and-finding-lawyers" },
      { title: "How to chat listing owners", slug: "how-to-chat-listing-owners" },
      { title: "How to review listings", slug: "how-to-review-listings" },
      { title: "How to compare listings", slug: "how-to-compare-listings" },
      { title: "Managing client live chats", slug: "managing-client-live-chats" },
    ],
  },
  {
    name: "For Lawyers",
    articles: [
      { title: "How to use this site", slug: "how-to-use-this-site-lawyer" },
      { title: "Creating a Lawyer listing", slug: "creating-a-lawyer-listing" },
      { title: "Featured lawyer listings", slug: "featured-lawyer-listings" },
      { title: "Lawyer dashboard", slug: "lawyer-dashboard" },
      { title: "Setting up lawyer appointments", slug: "setting-up-lawyer-appointments" },
      { title: "Managing lawyer live chats", slug: "managing-lawyer-live-chats" },
      { title: "Applying for a position", slug: "applying-for-a-position" },
      { title: "How to claim a lawyer listing", slug: "how-to-claim-a-lawyer-listing" },
    ],
  },
  {
    name: "For Chambers",
    articles: [
      { title: "How to use this site", slug: "how-to-use-this-site-chamber" },
      { title: "Creating a chamber listing", slug: "creating-a-chamber-listing" },
      { title: "Featured chamber listings", slug: "featured-chamber-listings" },
      { title: "Chamber dashboard", slug: "chamber-dashboard" },
      { title: "Adding lawyer listings to a chamber", slug: "adding-lawyer-listings-to-a-chamber" },
      { title: "Setting up chamber appointments", slug: "setting-up-chamber-appointments" },
      { title: "Managing chamber live chats", slug: "managing-chamber-live-chats" },
      { title: "How to claim a chamber listing", slug: "how-to-claim-a-chamber-listing" },
    ],
  },
];

export const ARTICLES: Record<string, ArticleContent> = {
  "how-to-use-this-site": {
    title: "How to Use This Site",
    category: "Documentation",
    content: [
      "Lawyard Directory is Nigeria's premier legal marketplace, connecting individuals and businesses with legal professionals across the country.",
      "Browse lawyer and chamber listings by specialty, location, or search directly. Each profile includes practice areas, experience, ratings, and direct contact information.",
      "To get started, use the search bar or browse specialties to find the right legal professional for your needs. You can compare listings, read reviews, and contact lawyers directly through the platform.",
    ],
  },
  "how-to-use-this-site-client": {
    title: "How to Use This Site",
    category: "For Clients",
    content: [
      "Welcome to Lawyard Directory! As a client, you can find and connect with the best legal professionals in Nigeria.",
      "Start by creating your free client profile. Once registered, you can search for lawyers and chambers by specialty, location, or name. Each listing provides detailed information including practice areas, years of experience, education, ratings, and client reviews.",
      "Use the comparison feature to evaluate multiple lawyers side by side. When you find the right fit, you can initiate a chat, book an appointment, or contact them directly through the platform.",
    ],
  },
  "creating-a-profile": {
    title: "Creating a Profile",
    category: "For Clients",
    content: [
      "Creating a client profile on Lawyard Directory is quick and free. Your profile helps lawyers understand your legal needs and respond more effectively.",
      "Sign up using your email address or Google account. Fill in your basic information including your name, phone number, and location. You can optionally add a profile photo and describe your general legal interests.",
      "Once your profile is complete, you can start searching for lawyers, save favourites, and manage your appointments and chats from your personal dashboard.",
    ],
  },
  "guest-dashboard": {
    title: "Guest Dashboard",
    category: "For Clients",
    content: [
      "Your guest dashboard is the command centre for all your activities on Lawyard Directory.",
      "From the dashboard, you can: View and manage your profile, Track your saved lawyers and chambers, Monitor ongoing conversations with listing owners, Review your appointment history and upcoming bookings, See your submitted reviews and ratings.",
      "Access your dashboard by clicking your profile icon in the top-right corner after signing in.",
    ],
  },
  "searching-and-finding-lawyers": {
    title: "Searching and Finding Lawyers",
    category: "For Clients",
    content: [
      "Lawyard Directory offers powerful search and filtering to help you find the perfect legal professional.",
      "Use the search bar to find lawyers by name, firm, or keyword. Filter results by: Legal specialty (e.g., Corporate Law, Family Law, Criminal Law), Location (state, city), Rating and client reviews, Price range and fee structure.",
      "Each search result shows key information at a glance: the lawyer's name, photo, specialties, location, rating, and whether they're verified. Click any listing to view the full profile.",
    ],
  },
  "how-to-chat-listing-owners": {
    title: "How to Chat Listing Owners",
    category: "For Clients",
    content: [
      "The chat feature allows you to communicate directly with lawyers and chambers through the platform.",
      "To start a chat: Navigate to a lawyer or chamber profile, Look for the 'Send Message' or 'Chat' button, Type your message and send. The listing owner will receive your message and can respond at their convenience.",
      "All your conversations are stored in your dashboard, so you can easily refer back to them. Chat history is private between you and the listing owner.",
    ],
  },
  "how-to-review-listings": {
    title: "How to Review Listings",
    category: "For Clients",
    content: [
      "After engaging with a lawyer or chamber, you can leave a review to help other clients make informed decisions.",
      "To leave a review: Go to the lawyer or chamber profile, Scroll to the reviews section, Click 'Write a Review', Rate your experience (1-5 stars) and write your review.",
      "Reviews must be honest and based on your actual experience. Lawyard Directory moderates reviews to ensure they meet our community guidelines.",
    ],
  },
  "how-to-compare-listings": {
    title: "How to Compare Listings",
    category: "For Clients",
    content: [
      "The compare feature lets you evaluate multiple lawyers or chambers side by side to find the best fit for your legal needs.",
      "To compare listings: Click the compare icon on any listing card, Add up to 4 listings to your comparison list, Navigate to the comparison page, View a side-by-side breakdown of each listing's credentials, specialties, ratings, and more.",
      "The comparison view highlights key differences and helps you make an informed decision before reaching out.",
    ],
  },
  "managing-client-live-chats": {
    title: "Managing Client Live Chats",
    category: "For Clients",
    content: [
      "Your live chat inbox manages all conversations with lawyers and chambers.",
      "Access your chats from the dashboard or the chat icon. You can: View active conversations, See message timestamps and read status, Send new messages, Archive completed conversations.",
      "Notifications for new messages appear in the header. You can respond at your convenience — there's no time limit on conversations.",
    ],
  },
  "how-to-use-this-site-lawyer": {
    title: "How to Use This Site",
    category: "For Lawyers",
    content: [
      "Lawyard Directory helps lawyers build their online presence and connect with potential clients across Nigeria.",
      "Create a compelling lawyer listing that showcases your expertise, experience, and practice areas. Use your dashboard to manage your profile, respond to client inquiries, and track your listing's performance.",
      "Stand out with a featured listing, collect client reviews, and use the platform's tools to manage appointments and live chats efficiently.",
    ],
  },
  "creating-a-lawyer-listing": {
    title: "Creating a Lawyer Listing",
    category: "For Lawyers",
    content: [
      "Your lawyer listing is your professional storefront on Lawyard Directory.",
      "To create a listing: Click 'Add Listing' in the header, Fill in your professional information including specialties, experience, education, and bar admission details, Upload a professional photo and any supporting documents, Choose your listing plan (Free or Featured), Submit for verification.",
      "Once verified, your listing will appear in search results. Keep your information up to date to attract the right clients.",
    ],
  },
  "featured-lawyer-listings": {
    title: "Featured Lawyer Listings",
    category: "For Lawyers",
    content: [
      "Featured listings receive premium placement in search results and on specialty pages, giving you maximum visibility.",
      "Benefits of featured listings: Appear at the top of relevant search results, Highlighted with a featured badge, Priority in specialty category pages, Increased profile views and client inquiries.",
      "Featured slots are available on a subscription basis. Check the pricing page for current rates and availability.",
    ],
  },
  "lawyer-dashboard": {
    title: "Lawyer Dashboard",
    category: "For Lawyers",
    content: [
      "The lawyer dashboard gives you full control over your directory presence.",
      "From your dashboard you can: Update your profile and listing details, View profile analytics and views, Manage client inquiries and messages, Set up and manage appointments, Respond to reviews, Track your subscription and featured listing status.",
      "Access your dashboard by signing in and clicking your profile icon.",
    ],
  },
  "setting-up-lawyer-appointments": {
    title: "Setting Up Lawyer Appointments",
    category: "For Lawyers",
    content: [
      "Configure your availability so clients can book appointments directly through the platform.",
      "To set up appointments: Go to your dashboard settings, Set your available days and time slots, Choose appointment duration (15, 30, 45, or 60 minutes), Set your consultation fees (if any), Configure whether appointments are in-person, virtual, or both.",
      "Clients can book available slots directly. You'll receive a notification for each booking and can confirm or reschedule as needed.",
    ],
  },
  "managing-lawyer-live-chats": {
    title: "Managing Lawyer Live Chats",
    category: "For Lawyers",
    content: [
      "Live chat lets you communicate directly with potential clients in real time.",
      "Access your chat inbox from the dashboard. You can: View incoming messages from clients, Respond at your convenience, See client profiles and inquiry context, Archive resolved conversations.",
      "Prompt responses improve your chances of converting inquiries into clients. Enable notifications to never miss a message.",
    ],
  },
  "applying-for-a-position": {
    title: "Applying for a Position",
    category: "For Lawyers",
    content: [
      "Lawyers can apply for positions advertised by chambers on the directory.",
      "To apply for a position: Browse chamber listings that have open positions, Review the position details and requirements, Click 'Apply' and submit your application including your CV and cover letter, Track your application status from your dashboard.",
      "Chambers will review your application and reach out through the platform if they'd like to proceed.",
    ],
  },
  "how-to-claim-a-lawyer-listing": {
    title: "How to Claim a Lawyer Listing",
    category: "For Lawyers",
    content: [
      "If your profile already exists on Lawyard Directory but isn't managed by you, you can claim it.",
      "To claim a listing: Search for your name on the directory, Click the listing and select 'Claim This Listing', Verify your identity by providing your professional credentials, Submit your claim for review.",
      "Once verified, you'll gain full control over the listing and can update it as needed.",
    ],
  },
  "how-to-use-this-site-chamber": {
    title: "How to Use This Site",
    category: "For Chambers",
    content: [
      "Lawyard Directory provides chambers with a powerful platform to showcase their practice and attract top legal talent and clients.",
      "Create a comprehensive chamber listing that highlights your firm's areas of expertise, notable cases, team members, and client testimonials.",
      "Use the chamber dashboard to manage your firm's profile, add lawyer listings to your chamber, set up appointments, and manage client inquiries.",
    ],
  },
  "creating-a-chamber-listing": {
    title: "Creating a Chamber Listing",
    category: "For Chambers",
    content: [
      "Your chamber listing represents your entire firm on Lawyard Directory.",
      "To create a listing: Click 'Add Listing' in the header, Enter your chamber's details including firm name, practice areas, history, and team size, Add information about your key practice areas and notable work, Upload your firm's logo and photos of your premises, Submit for verification.",
      "Once verified, your chamber will appear in search results. You can add individual lawyers to your chamber listing to build out your team profile.",
    ],
  },
  "featured-chamber-listings": {
    title: "Featured Chamber Listings",
    category: "For Chambers",
    content: [
      "Featured chamber listings receive premium visibility across the directory.",
      "Benefits include: Priority placement in search results, Featured badge on your listing, Enhanced visibility on specialty pages, Increased inquiries from potential clients, Higher visibility for recruitment.",
      "Contact us for featured listing availability and pricing tailored to chambers.",
    ],
  },
  "chamber-dashboard": {
    title: "Chamber Dashboard",
    category: "For Chambers",
    content: [
      "The chamber dashboard gives you comprehensive control over your firm's directory presence.",
      "From your dashboard: Manage your chamber profile and branding, Add or remove lawyers from your chamber listing, View analytics and profile engagement, Handle client inquiries and appointments, Manage job postings for open positions, Track featured listing status.",
      "Access the dashboard after signing in to your chamber account.",
    ],
  },
  "adding-lawyer-listings-to-a-chamber": {
    title: "Adding Lawyer Listings to a Chamber",
    category: "For Chambers",
    content: [
      "Build out your chamber's team by adding lawyer profiles to your listing.",
      "To add lawyers: Go to your chamber dashboard, Navigate to 'Team Management', Search for lawyers by name or invite them via email, Assign their role and practice areas within your chamber.",
      "Added lawyers will appear on your chamber profile. Lawyers must confirm the association. You can also create new lawyer profiles directly from your dashboard.",
    ],
  },
  "setting-up-chamber-appointments": {
    title: "Setting Up Chamber Appointments",
    category: "For Chambers",
    content: [
      "Manage your chamber's client appointments efficiently through the platform.",
      "Configure availability for the entire chamber or per lawyer: Set business hours, Define appointment types (consultations, meetings, court prep), Assign available lawyers to appointment slots, Set fee structures for different services.",
      "Clients can book appointments through your chamber profile. You'll receive notifications and can manage the calendar from the dashboard.",
    ],
  },
  "managing-chamber-live-chats": {
    title: "Managing Chamber Live Chats",
    category: "For Chambers",
    content: [
      "Live chat helps your chamber connect with potential clients and candidates.",
      "Manage incoming chats from the dashboard: Route inquiries to the appropriate department or lawyer, Track response times and client satisfaction, Archive and reference past conversations.",
      "Set up auto-responses for frequently asked questions and ensure timely responses to maximise engagement.",
    ],
  },
  "how-to-claim-a-chamber-listing": {
    title: "How to Claim a Chamber Listing",
    category: "For Chambers",
    content: [
      "If your chamber already has a listing that you need to manage, you can claim it.",
      "To claim a chamber listing: Find your chamber on the directory, Click 'Claim This Listing', Verify your authority to represent the chamber, Submit your verification documents.",
      "Once approved, you'll gain administrative control over the listing and can manage all aspects of your chamber's presence on the platform.",
    ],
  },
};
