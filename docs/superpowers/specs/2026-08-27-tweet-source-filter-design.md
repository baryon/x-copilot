# Tweet Source Filter Design

## Goal

Let users limit the tweet list to all tweets, Likes, Bookmarks, or their own posts without changing synchronized data.

## Interaction

- Add a four-option segmented control below the search field: `全部`, `喜欢`, `书签`, `我的推文`.
- Default to `全部` whenever the page is opened.
- Keep the selected source only in page-local React state; no settings or storage migration is required.
- Highlight the selected segment with the existing X blue color and keep inactive segments neutral.

## Filtering

- `全部` includes every synchronized source.
- The other segments match the existing single `tweet.source` value.
- Apply source filtering together with keyword search, then sort the resulting tweets by publication time in descending order.
- Switching the source never modifies or deletes synchronized tweets.

## Counts

- With `全部` selected and no keyword, show the total tweet count.
- With a source selected and no keyword, show the visible count and total count.
- With a keyword, show the count after both source and keyword filters, together with the total count.

## Implementation

Add a small, pure source-filter helper that accepts tweets and the selected filter. `App` owns the selected filter state, renders the segmented control, applies the source filter before the existing keyword filter, and continues to use the existing publication-time sorter.

## Verification

- Unit-test all four filter options.
- Verify source filtering composes with keyword filtering without mutating the stored array.
- Keep source-label, publication-time extraction, fallback, and descending-sort tests passing.
- Run the complete TypeScript and Vite production build.
