import NotFoundLayout from "@/components/ui/not-found-layout"

export default function NotFound() {
  return (
    <NotFoundLayout
      badgeText="404"
      title="This part of Lawyard could not be found."
      description="The page or listing you tried to open does not exist or has been moved."
      primaryActionText="Return Home"
      primaryActionUrl="/"
      secondaryActionText="Go Back"
      suggestions={[
        { label: "Go to Directory", href: "/directory" },
        { label: "Search Lawyers", href: "/directory/search" },
        { label: "Browse the Directory", href: "/directory" },
        { label: "Search Lawyers", href: "/directory/search" },
      ]}
    />
  )
}
