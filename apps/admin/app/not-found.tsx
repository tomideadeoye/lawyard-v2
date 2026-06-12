import NotFoundLayout from "@repo/ui/components/not-found-layout"

export default function NotFound() {
  return (
    <NotFoundLayout
      badgeText="Admin Panel"
      title="Administrative View Not Found"
      description="The dashboard link, resource, or view you are trying to access does not exist or has been archived."
      primaryActionText="Return to Dashboard"
      primaryActionUrl="/"
    />
  )
}
