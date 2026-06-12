import NotFoundLayout from "@repo/ui/components/not-found-layout"

export default function NotFound() {
  return (
    <NotFoundLayout
      badgeText="Directory Finder"
      title="This listing or page could not be found."
      description="The profile, chamber listing, or page you are looking for does not exist or has been removed from our directory database."
      primaryActionText="Search Directory"
      primaryActionUrl="/search"
      secondaryActionText="Return Home"
      secondaryActionUrl="/"
    />
  )
}
