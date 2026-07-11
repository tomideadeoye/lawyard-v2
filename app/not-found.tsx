import NotFoundLayout from "@/components/ui/not-found-layout"

export default function NotFound() {
  return (
    <NotFoundLayout
      badgeText="404"
      title="This part of Lawyard could not be found."
      description="The page, insight, or listing you tried to open does not exist or has been moved."
      primaryActionText="Return Home"
      primaryActionUrl="/"
      secondaryActionText="Go Back"
      suggestions={[
        { label: "Go to Directory", href: "/directory" },
        { label: "Search Lawyers", href: "/directory/search" },
        { label: "Browse News & Insights", href: "/(main)/insights" },
        { label: "Visit Lawyard Home", href: "/(main)" },
      ]}
    />
  )
}
