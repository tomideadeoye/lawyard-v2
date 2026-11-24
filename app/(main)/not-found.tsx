import NotFoundLayout from "@/components/ui/not-found-layout"

export default function NotFound() {
  return (
    <NotFoundLayout
      suggestions={[
        { label: "Read the Latest Insights", href: "/insights" },
        { label: "Browse Categories", href: "/category/news" },
        { label: "Watch Lawyard TV", href: "/tv" },
        { label: "Listen to Podcasts", href: "/podcasts" },
      ]}
      description="The article, page, or insight you are looking for does not exist or has been moved."
    />
  )
}
