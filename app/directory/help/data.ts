import { TERMS } from "@/lib/constants";

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
    name: `For ${TERMS.client.plural}`,
    articles: [
      { title: "How to use this site", slug: "how-to-use-this-site-client" },
      { title: "Creating a profile", slug: "creating-a-profile" },
      { title: "Guest dashboard", slug: "guest-dashboard" },
      { title: `Searching and finding ${TERMS.lawyer.lowerPlural}`, slug: "searching-and-finding-lawyers" },
      { title: "How to chat listing owners", slug: "how-to-chat-listing-owners" },
      { title: "How to review listings", slug: "how-to-review-listings" },
      { title: "How to compare listings", slug: "how-to-compare-listings" },
      { title: `Managing ${TERMS.client.lower} live chats`, slug: "managing-client-live-chats" },
    ],
  },
  {
    name: `For ${TERMS.lawyer.plural}`,
    articles: [
      { title: "How to use this site", slug: "how-to-use-this-site-lawyer" },
      { title: `Creating a ${TERMS.lawyer.singular} listing`, slug: "creating-a-lawyer-listing" },
      { title: `Featured ${TERMS.lawyer.lower} listings`, slug: "featured-lawyer-listings" },
      { title: `${TERMS.lawyer.singular} dashboard`, slug: "lawyer-dashboard" },
      { title: `Setting up ${TERMS.lawyer.lower} appointments`, slug: "setting-up-lawyer-appointments" },
      { title: `Managing ${TERMS.lawyer.lower} live chats`, slug: "managing-lawyer-live-chats" },
      { title: "Applying for a position", slug: "applying-for-a-position" },
      { title: `How to claim a ${TERMS.lawyer.lower} listing`, slug: "how-to-claim-a-lawyer-listing" },
    ],
  },
  {
    name: `For ${TERMS.firm.plural}`,
    articles: [
      { title: "How to use this site", slug: "how-to-use-this-site-chamber" },
      { title: `Creating a ${TERMS.firm.lower} listing`, slug: "creating-a-chamber-listing" },
      { title: `Featured ${TERMS.firm.lower} listings`, slug: "featured-chamber-listings" },
      { title: `${TERMS.firm.singular} dashboard`, slug: "chamber-dashboard" },
      { title: `Adding ${TERMS.lawyer.lower} listings to a ${TERMS.firm.lower}`, slug: "adding-lawyer-listings-to-a-chamber" },
      { title: `Setting up ${TERMS.firm.lower} appointments`, slug: "setting-up-chamber-appointments" },
      { title: `Managing ${TERMS.firm.lower} live chats`, slug: "managing-chamber-live-chats" },
      { title: `How to claim a ${TERMS.firm.lower} listing`, slug: "how-to-claim-a-chamber-listing" },
    ],
  },
];

export const ARTICLES: Record<string, ArticleContent> = {
  "how-to-use-this-site": {
    title: "How to Use This Site",
    category: "Documentation",
    content: [
      "Lawyard Directory is Nigeria's premier legal marketplace, connecting individuals and businesses with legal professionals across the country.",
      `Browse ${TERMS.lawyer.lower} and ${TERMS.firm.lower} listings by specialty, location, or search directly. Each profile includes practice areas, experience, ratings, and direct contact information.`,
      `To get started, use the search bar or browse specialties to find the right legal professional for your needs. You can compare listings, read reviews, and contact ${TERMS.lawyer.lowerPlural} directly through the platform.`,
    ],
  },
  "how-to-use-this-site-client": {
    title: "How to Use This Site",
    category: `For ${TERMS.client.plural}`,
    content: [
      `Welcome to Lawyard Directory! As a ${TERMS.client.lower}, you can find and connect with the best legal professionals in Nigeria.`,
      `Start by creating your free ${TERMS.client.lower} profile. Once registered, you can search for ${TERMS.lawyer.lowerPlural} and ${TERMS.firm.lowerPlural} by specialty, location, or name. Each listing provides detailed information including practice areas, years of experience, education, ratings, and ${TERMS.client.lower} reviews.`,
      `Use the comparison feature to evaluate multiple ${TERMS.lawyer.lowerPlural} side by side. When you find the right fit, you can initiate a chat, book an appointment, or contact them directly through the platform.`,
    ],
  },
  "creating-a-profile": {
    title: "Creating a Profile",
    category: `For ${TERMS.client.plural}`,
    content: [
      `Creating a ${TERMS.client.lower} profile on Lawyard Directory is quick and free. Your profile helps ${TERMS.lawyer.lowerPlural} understand your legal needs and respond more effectively.`,
      "Sign up using your email address or Google account. Fill in your basic information including your name, phone number, and location. You can optionally add a profile photo and describe your general legal interests.",
      `Once your profile is complete, you can start searching for ${TERMS.lawyer.lowerPlural}, save favourites, and manage your appointments and chats from your personal dashboard.`,
    ],
  },
  "guest-dashboard": {
    title: "Guest Dashboard",
    category: `For ${TERMS.client.plural}`,
    content: [
      "Your guest dashboard is the command centre for all your activities on Lawyard Directory.",
      `From the dashboard, you can: View and manage your profile, Track your saved ${TERMS.lawyer.lowerPlural} and ${TERMS.firm.lowerPlural}, Monitor ongoing conversations with listing owners, Review your appointment history and upcoming bookings, See your submitted reviews and ratings.`,
      "Access your dashboard by clicking your profile icon in the top-right corner after signing in.",
    ],
  },
  "searching-and-finding-lawyers": {
    title: `Searching and Finding ${TERMS.lawyer.plural}`,
    category: `For ${TERMS.client.plural}`,
    content: [
      "Lawyard Directory offers powerful search and filtering to help you find the perfect legal professional.",
      `Use the search bar to find ${TERMS.lawyer.lowerPlural} by name, firm, or keyword. Filter results by: Legal specialty (e.g., Corporate Law, Family Law, Criminal Law), Location (state, city), Rating and ${TERMS.client.lower} reviews, Price range and fee structure.`,
      `Each search result shows key information at a glance: the ${TERMS.lawyer.lower}'s name, photo, specialties, location, rating, and whether they're verified. Click any listing to view the full profile.`,
    ],
  },
  "how-to-chat-listing-owners": {
    title: "How to Chat Listing Owners",
    category: `For ${TERMS.client.plural}`,
    content: [
      `The chat feature allows you to communicate directly with ${TERMS.lawyer.lowerPlural} and ${TERMS.firm.lowerPlural} through the platform.`,
      `To start a chat: Navigate to a ${TERMS.lawyer.lower} or ${TERMS.firm.lower} profile, Look for the 'Send Message' or 'Chat' button, Type your message and send. The listing owner will receive your message and can respond at their convenience.`,
      "All your conversations are stored in your dashboard, so you can easily refer back to them. Chat history is private between you and the listing owner.",
    ],
  },
  "how-to-review-listings": {
    title: "How to Review Listings",
    category: `For ${TERMS.client.plural}`,
    content: [
      `After engaging with a ${TERMS.lawyer.lower} or ${TERMS.firm.lower}, you can leave a review to help other ${TERMS.client.lowerPlural} make informed decisions.`,
      `To leave a review: Go to the ${TERMS.lawyer.lower} or ${TERMS.firm.lower} profile, Scroll to the reviews section, Click 'Write a Review', Rate your experience (1-5 stars) and write your review.`,
      "Reviews must be honest and based on your actual experience. Lawyard Directory moderates reviews to ensure they meet our community guidelines.",
    ],
  },
  "how-to-compare-listings": {
    title: "How to Compare Listings",
    category: `For ${TERMS.client.plural}`,
    content: [
      `The compare feature lets you evaluate multiple ${TERMS.lawyer.lowerPlural} or ${TERMS.firm.lowerPlural} side by side to find the best fit for your legal needs.`,
      "To compare listings: Click the compare icon on any listing card, Add up to 4 listings to your comparison list, Navigate to the comparison page, View a side-by-side breakdown of each listing's credentials, specialties, ratings, and more.",
      "The comparison view highlights key differences and helps you make an informed decision before reaching out.",
    ],
  },
  "managing-client-live-chats": {
    title: `Managing ${TERMS.client.singular} Live Chats`,
    category: `For ${TERMS.client.plural}`,
    content: [
      `Your live chat inbox manages all conversations with ${TERMS.lawyer.lowerPlural} and ${TERMS.firm.lowerPlural}.`,
      "Access your chats from the dashboard or the chat icon. You can: View active conversations, See message timestamps and read status, Send new messages, Archive completed conversations.",
      "Notifications for new messages appear in the header. You can respond at your convenience — there's no time limit on conversations.",
    ],
  },
  "how-to-use-this-site-lawyer": {
    title: "How to Use This Site",
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      `Lawyard Directory helps ${TERMS.lawyer.lowerPlural} build their online presence and connect with potential ${TERMS.client.lowerPlural} across Nigeria.`,
      `Create a compelling ${TERMS.lawyer.lower} listing that showcases your expertise, experience, and practice areas. Use your dashboard to manage your profile, respond to ${TERMS.client.lower} inquiries, and track your listing's performance.`,
      `Stand out with a featured listing, collect ${TERMS.client.lower} reviews, and use the platform's tools to manage appointments and live chats efficiently.`,
    ],
  },
  "creating-a-lawyer-listing": {
    title: `Creating a ${TERMS.lawyer.singular} Listing`,
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      `Your ${TERMS.lawyer.lower} listing is your professional storefront on Lawyard Directory.`,
      "To create a listing: Click 'Add Listing' in the header, Fill in your professional information including specialties, experience, education, and bar admission details, Upload a professional photo and any supporting documents, Choose your listing plan (Free or Featured), Submit for verification.",
      `Once verified, your listing will appear in search results. Keep your information up to date to attract the right ${TERMS.client.lowerPlural}.`,
    ],
  },
  "featured-lawyer-listings": {
    title: `Featured ${TERMS.lawyer.singular} Listings`,
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      "Featured listings receive premium placement in search results and on specialty pages, giving you maximum visibility.",
      `Benefits of featured listings: Appear at the top of relevant search results, Highlighted with a featured badge, Priority in specialty category pages, Increased profile views and ${TERMS.client.lower} inquiries.`,
      "Featured slots are available on a subscription basis. Check the pricing page for current rates and availability.",
    ],
  },
  "lawyer-dashboard": {
    title: `${TERMS.lawyer.singular} Dashboard`,
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      `The ${TERMS.lawyer.lower} dashboard gives you full control over your directory presence.`,
      `From your dashboard you can: Update your profile and listing details, View profile analytics and views, Manage ${TERMS.client.lower} inquiries and messages, Set up and manage appointments, Respond to reviews, Track your subscription and featured listing status.`,
      "Access your dashboard by signing in and clicking your profile icon.",
    ],
  },
  "setting-up-lawyer-appointments": {
    title: `Setting Up ${TERMS.lawyer.singular} Appointments`,
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      `Configure your availability so ${TERMS.client.lowerPlural} can book appointments directly through the platform.`,
      "To set up appointments: Go to your dashboard settings, Set your available days and time slots, Choose appointment duration (15, 30, 45, or 60 minutes), Set your consultation fees (if any), Configure whether appointments are in-person, virtual, or both.",
      `${TERMS.client.plural} can book available slots directly. You'll receive a notification for each booking and can confirm or reschedule as needed.`,
    ],
  },
  "managing-lawyer-live-chats": {
    title: `Managing ${TERMS.lawyer.singular} Live Chats`,
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      `Live chat lets you communicate directly with potential ${TERMS.client.lowerPlural} in real time.`,
      `Access your chat inbox from the dashboard. You can: View incoming messages from ${TERMS.client.lowerPlural}, Respond at your convenience, See ${TERMS.client.lower} profiles and inquiry context, Archive resolved conversations.`,
      `Prompt responses improve your chances of converting inquiries into ${TERMS.client.lowerPlural}. Enable notifications to never miss a message.`,
    ],
  },
  "applying-for-a-position": {
    title: "Applying for a Position",
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      `${TERMS.lawyer.plural} can apply for positions advertised by ${TERMS.firm.lowerPlural} on the directory.`,
      `To apply for a position: Browse ${TERMS.firm.lower} listings that have open positions, Review the position details and requirements, Click 'Apply' and submit your application including your CV and cover letter, Track your application status from your dashboard.`,
      `${TERMS.firm.plural} will review your application and reach out through the platform if they'd like to proceed.`,
    ],
  },
  "how-to-claim-a-lawyer-listing": {
    title: `How to Claim a ${TERMS.lawyer.singular} Listing`,
    category: `For ${TERMS.lawyer.plural}`,
    content: [
      "If your profile already exists on Lawyard Directory but isn't managed by you, you can claim it.",
      "To claim a listing: Search for your name on the directory, Click the listing and select 'Claim This Listing', Verify your identity by providing your professional credentials, Submit your claim for review.",
      "Once verified, you'll gain full control over the listing and can update it as needed.",
    ],
  },
  "how-to-use-this-site-chamber": {
    title: "How to Use This Site",
    category: `For ${TERMS.firm.plural}`,
    content: [
      `Lawyard Directory provides ${TERMS.firm.lowerPlural} with a powerful platform to showcase their practice and attract top legal talent and ${TERMS.client.lowerPlural}.`,
      `Create a comprehensive ${TERMS.firm.lower} listing that highlights your firm's areas of expertise, notable cases, team members, and ${TERMS.client.lower} testimonials.`,
      `Use the ${TERMS.firm.lower} dashboard to manage your firm's profile, add ${TERMS.lawyer.lower} listings to your ${TERMS.firm.lower}, set up appointments, and manage ${TERMS.client.lower} inquiries.`,
    ],
  },
  "creating-a-chamber-listing": {
    title: `Creating a ${TERMS.firm.singular} Listing`,
    category: `For ${TERMS.firm.plural}`,
    content: [
      `Your ${TERMS.firm.lower} listing represents your entire firm on Lawyard Directory.`,
      `To create a listing: Click 'Add Listing' in the header, Enter your ${TERMS.firm.lower}'s details including firm name, practice areas, history, and team size, Add information about your key practice areas and notable work, Upload your firm's logo and photos of your premises, Submit for verification.`,
      `Once verified, your ${TERMS.firm.lower} will appear in search results. You can add individual ${TERMS.lawyer.lowerPlural} to your ${TERMS.firm.lower} listing to build out your team profile.`,
    ],
  },
  "featured-chamber-listings": {
    title: `Featured ${TERMS.firm.singular} Listings`,
    category: `For ${TERMS.firm.plural}`,
    content: [
      `Featured ${TERMS.firm.lower} listings receive premium visibility across the directory.`,
      `Benefits include: Priority placement in search results, Featured badge on your listing, Enhanced visibility on specialty pages, Increased inquiries from potential ${TERMS.client.lowerPlural}, Higher visibility for recruitment.`,
      `Contact us for featured listing availability and pricing tailored to ${TERMS.firm.lowerPlural}.`,
    ],
  },
  "chamber-dashboard": {
    title: `${TERMS.firm.singular} Dashboard`,
    category: `For ${TERMS.firm.plural}`,
    content: [
      `The ${TERMS.firm.lower} dashboard gives you comprehensive control over your firm's directory presence.`,
      `From your dashboard: Manage your ${TERMS.firm.lower} profile and branding, Add or remove ${TERMS.lawyer.lowerPlural} from your ${TERMS.firm.lower} listing, View analytics and profile engagement, Handle ${TERMS.client.lower} inquiries and appointments, Manage job postings for open positions, Track featured listing status.`,
      `Access the dashboard after signing in to your ${TERMS.firm.lower} account.`,
    ],
  },
  "adding-lawyer-listings-to-a-chamber": {
    title: `Adding ${TERMS.lawyer.singular} Listings to a ${TERMS.firm.singular}`,
    category: `For ${TERMS.firm.plural}`,
    content: [
      `Build out your ${TERMS.firm.lower}'s team by adding ${TERMS.lawyer.lower} profiles to your listing.`,
      `To add ${TERMS.lawyer.lowerPlural}: Go to your ${TERMS.firm.lower} dashboard, Navigate to 'Team Management', Search for ${TERMS.lawyer.lowerPlural} by name or invite them via email, Assign their role and practice areas within your ${TERMS.firm.lower}.`,
      `Added ${TERMS.lawyer.lowerPlural} will appear on your ${TERMS.firm.lower} profile. ${TERMS.lawyer.plural} must confirm the association. You can also create new ${TERMS.lawyer.lower} profiles directly from your dashboard.`,
    ],
  },
  "setting-up-chamber-appointments": {
    title: `Setting Up ${TERMS.firm.singular} Appointments`,
    category: `For ${TERMS.firm.plural}`,
    content: [
      `Manage your ${TERMS.firm.lower}'s ${TERMS.client.lower} appointments efficiently through the platform.`,
      `Configure availability for the entire ${TERMS.firm.lower} or per ${TERMS.lawyer.lower}: Set business hours, Define appointment types (consultations, meetings, court prep), Assign available ${TERMS.lawyer.lowerPlural} to appointment slots, Set fee structures for different services.`,
      `${TERMS.client.plural} can book appointments through your ${TERMS.firm.lower} profile. You'll receive notifications and can manage the calendar from the dashboard.`,
    ],
  },
  "managing-chamber-live-chats": {
    title: `Managing ${TERMS.firm.singular} Live Chats`,
    category: `For ${TERMS.firm.plural}`,
    content: [
      `Live chat helps your ${TERMS.firm.lower} connect with potential ${TERMS.client.lowerPlural} and candidates.`,
      `Manage incoming chats from the dashboard: Route inquiries to the appropriate department or ${TERMS.lawyer.lower}, Track response times and ${TERMS.client.lower} satisfaction, Archive and reference past conversations.`,
      "Set up auto-responses for frequently asked questions and ensure timely responses to maximise engagement.",
    ],
  },
  "how-to-claim-a-chamber-listing": {
    title: `How to Claim a ${TERMS.firm.singular} Listing`,
    category: `For ${TERMS.firm.plural}`,
    content: [
      `If your ${TERMS.firm.lower} already has a listing that you need to manage, you can claim it.`,
      `To claim a ${TERMS.firm.lower} listing: Find your ${TERMS.firm.lower} on the directory, Click 'Claim This Listing', Verify your authority to represent the ${TERMS.firm.lower}, Submit your verification documents.`,
      `Once approved, you'll gain administrative control over the listing and can manage all aspects of your ${TERMS.firm.lower}'s presence on the platform.`,
    ],
  },
};
