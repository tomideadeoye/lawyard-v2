'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleBookmark, getBookmarkedLawyerIds } from '@/app/directory/actions/bookmarks'

interface BookmarkButtonProps {
  lawyerId: string
  initialBookmarked?: boolean
  className?: string
}

export default function BookmarkButton({ lawyerId, initialBookmarked = false, className = '' }: BookmarkButtonProps) {
  const queryClient = useQueryClient()

  // Global cache query for all bookmarks
  const { data: bookmarkedIds = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: getBookmarkedLawyerIds,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  })

  // Use global cache status; fallback to prop during initial client load/mount
  const bookmarked = isLoading ? initialBookmarked : bookmarkedIds.includes(lawyerId)

  // Toggle Mutation with Optimistic Updates
  const mutation = useMutation({
    mutationFn: toggleBookmark,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })

      // Snapshot the previous list
      const previousBookmarks = queryClient.getQueryData<string[]>(['bookmarks'])

      // Optimistically update list
      if (previousBookmarks) {
        const nextBookmarks = previousBookmarks.includes(id)
          ? previousBookmarks.filter((item) => item !== id)
          : [...previousBookmarks, id]
        queryClient.setQueryData(['bookmarks'], nextBookmarks)
      } else {
        // If query hasn't run yet, initialize cache with optimistic state
        queryClient.setQueryData(['bookmarks'], initialBookmarked ? [] : [id])
      }

      return { previousBookmarks }
    },
    onError: (err, id, context) => {
      // Rollback on failure
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks'], context.previousBookmarks)
      }
    },
    onSettled: () => {
      // Refetch to sync state
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  const pending = mutation.isPending

  function handleClick() {
    if (pending || isLoading) return
    mutation.mutate(lawyerId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center justify-center transition-all duration-200 ${
        pending ? 'opacity-50 pointer-events-none' :
        bookmarked
          ? 'text-accent scale-110'
          : 'text-muted-foreground/50 hover:text-muted-foreground'
      } ${className}`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this profile'}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this profile'}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
