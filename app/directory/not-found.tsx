import NotFoundLayout from "@/components/ui/not-found-layout"

export default function NotFound() {
  return (
    <NotFoundLayout
      badgeText="Listing Not Found"
      title="We couldn't find that listing."
      description="The lawyer, law firm, or service page you requested is unavailable."
      primaryActionText="Search Directory"
      primaryActionUrl="/search"
      secondaryActionText="Directory Home"
      secondaryActionUrl="/"
      suggestions={[
        { label: "Browse Verified Lawyers", href: "/search" },
        { label: "View Popular Listings", href: "/" },
        { label: "Add a Listing", href: "/add-listing" },
      ]}
    />
  )
}
