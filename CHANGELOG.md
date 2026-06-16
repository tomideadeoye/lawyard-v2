# Changelog

## [Unreleased]

### Added
- **CategoryMultiselect**: Replaced hardcoded preset categories with specialties from `specialties.json` (practice areas)
- **PublishArticleForm**: Converted to `useMutation` (TanStack Query) with controlled state; category multiselect now uses practice areas
- **PublishPodcastForm**: Converted to `useMutation` (TanStack Query) with controlled state; category multiselect uses practice areas
- **Migration**: Changed article/podcast category default from `'documentation'` to `'general-practice'` in `20260616000004_multiselect_categories.sql`
- **Lawyer inquiries**: New `lawyer_inquiries` table with RLS — anyone can submit, lawyers see their own, admins see all (`20260616000005_create_lawyer_inquiries.sql`)
- **Inquiry server actions**: `submitInquiry`, `getInquiries`, `getInquiryStats`, `markInquiryRead`, `getAllInquiriesAdmin` (`app/directory/actions/inquiries.ts`)
- **Listing detail page**: Fully rewritten with Tailwind — shows all extended fields (education, awards, FAQs, working hours, social links, gallery, video, contact info, volunteer/pro bono) with live contact form (`app/directory/lawyer/[id]/page.tsx`)
- **Inquiry inbox**: New `/directory/dashboard/inquiries` page with sidebar nav entry — split layout with inbox list + detail view, marks as read on selection
- **Dashboard**: Inquiries stat card now live (shows count + unread), Quick Actions includes Inquiries card with badge

### Changed
- **Category taxonomy**: Articles and podcasts now categorised by legal practice areas (from `specialties.json`) instead of internal content types (`documentation`, `clients`, `lawyers`, `chambers`)
- **Lawyer profile**: Converted from CSS modules to Tailwind, removed `profile.module.css`
