import NotFoundLayout from "@/components/ui/not-found-layout"

export default function NotFound() {
  return (
    <NotFoundLayout
      badgeText="Admin View Not Found"
      title="This admin page does not exist."
      description="The dashboard view, resource, or route you requested has been moved, restricted, or does not exist."
      primaryActionText="Return to Admin"
      primaryActionUrl="/admin"
      suggestions={[
        { label: "Dashboard", href: "/admin" },
        { label: "Lawyers", href: "/admin/lawyers" },
        { label: "Transactions", href: "/admin/transactions" },
        { label: "Settings", href: "/admin/settings" },
      ]}
    />
  )
}
