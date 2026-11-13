# Customer YouTube videos

The four Shorts URLs supplied by the owner are configured in `src/config/customer-video-reviews.ts`.

This release does not include an admin-dashboard video editor. To replace or add videos, edit the `customerVideoReviews` array in that file, using one individual YouTube video or Shorts URL per entry. Keep Shorts entries as `format: "portrait"`.

After editing the file, run the checks and deploy a new commit so the changes appear on the site. The current four supplied links are already included. More entries can be appended to the array.

The homepage embeds videos using YouTube's privacy-enhanced `youtube-nocookie.com` player URL generated from the supplied video ID. The site cannot force playback if YouTube restricts an individual video embedding; verify each video has embedding enabled in YouTube Studio.
