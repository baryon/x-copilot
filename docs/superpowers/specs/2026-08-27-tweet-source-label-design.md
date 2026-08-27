# Tweet Source Label Design

## Goal

Show one compact source label on every tweet card so users can tell whether the tweet was first synchronized from Bookmarks, Likes, or their own posts.

## Behavior

- Map `bookmarks` to `书签`.
- Map `likes` to `喜欢`.
- Map `own_tweets` to `我的推文`.
- Display exactly one label per tweet.
- Preserve the first synchronized source when the same tweet is encountered through another source. This matches the existing deduplication behavior in storage.

## Presentation

Place the source label in the author row immediately before the publication time. Use one restrained neutral badge style for all sources, with the text providing the distinction. The label has no interaction and does not change the card layout beyond the compact inline element.

## Implementation

Add a small source-to-label formatter beside the existing page presentation helpers. `TweetCard` renders the formatter result from the existing `tweet.source` field. No storage migration or schema change is required.

## Verification

- Unit-test all three source-to-label mappings.
- Keep the existing publication-time extraction, display fallback, and descending-sort tests passing.
- Run the complete TypeScript and Vite production build.
