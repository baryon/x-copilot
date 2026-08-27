# Incremental Source Sync Design

## Goal

Avoid scrolling through and extracting an entire X timeline on every synchronization. Each source should synchronize only items added since its previous completed pass.

## Source Independence

- Track synchronization history independently for `bookmarks`, `likes`, and `own_tweets`.
- Keep the existing `source` field as the first synchronized source used by the visible tweet label.
- Add internal source-membership history so the same tweet can be recognized as already synchronized from more than one source without changing its visible label.
- A tweet known from Bookmarks must not stop the first Likes synchronization unless it has also been observed during a previous Likes synchronization.

## Incremental Boundary

Before extraction starts, the background process loads tweet IDs previously observed for the selected source and sends them to the content script. The content script extracts timeline items from the top and tracks consecutive IDs already known for that source.

The synchronization stops after three consecutive newly observed timeline items are already known for the selected source. An unknown item resets the streak and is sent in the existing batches. Requiring a streak avoids stopping on a single reordered or pinned tweet while limiting repeat extraction to a small overlap around the previous boundary.

The current empty-scroll limit remains the fallback when no known boundary streak is found. This covers first synchronization, a removed boundary, a short timeline, and incomplete legacy history.

## Storage Merge

- New tweet IDs are inserted as they are today and initialized with the selected source in their internal source history.
- Existing tweet IDs keep their original visible `source` value.
- When an existing tweet is encountered through another source, merge that source into its internal history instead of discarding the observation.
- `newCount` continues to count newly stored tweets only; adding source history to an existing tweet does not count as a new tweet.

## Compatibility

Existing records without internal source history are treated as known for their current visible `source`. No migration pass or data clearing is required.

After upgrading, each source may need one complete synchronization to establish cross-source membership and its reliable incremental boundary. Later synchronizations stop at the known boundary.

## Popup

Add `我的推文` to the existing source selector. It uses the already implemented profile URL and the configured X username, matching the existing Likes username requirement.

## Non-Goals

- Synchronization remains additive. Removing a Bookmark, Like, or post from X does not delete the local tweet.
- This change does not alter the visible first-source label or list filtering behavior.
- It does not attempt to persist or replay X private API cursors.

## Verification

- Test source-specific known-ID lookup for legacy and new records.
- Test storage merging for new tweets, same-source duplicates, and cross-source duplicates while preserving the first source.
- Test extraction stopping at a source-specific known streak, continuing past a single pinned known tweet, and continuing when only another source knows the tweet.
- Test first synchronization fallback when there is no known boundary.
- Verify the popup exposes all three synchronization sources.
- Keep existing source label, source filter, publication-time, and sorting tests passing.
- Run the complete TypeScript and Vite production build.
