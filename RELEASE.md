# Release Guide

This guide explains how to create a new release of X Copilot extension.

## Release Checklist

### 1. Prepare the Release

- [ ] Update version in `package.json`
- [ ] Test all features thoroughly
- [ ] Update CHANGELOG or prepare release notes
- [ ] Commit all changes

### 2. Build Release Package

Run the release script:

```bash
pnpm run release
```

This will:
- Build the extension with production optimizations
- Create a `releases/x-copilot-v*.*.*.zip` file
- Display next steps

### 3. Create GitHub Release

1. Go to [GitHub Releases](https://github.com/baryon/x-copilot/releases/new)

2. **Tag version**: `v4.1.0` (use the version from package.json)

3. **Release title**: `X Copilot v4.1.0`

4. **Description**: Write release notes, for example:

   ```markdown
   ## What's New

   - ✨ AI-powered tweet summarization with streaming output
   - 💬 Smart reply generation with style options
   - 📄 Export summaries as Markdown files
   - 🔄 Real-time sync updates in search page

   ## Improvements

   - Improved article content extraction for X Article links
   - Better alignment for summarize button
   - Enhanced streaming performance

   ## Installation

   Download `x-copilot-v4.1.0.zip`, unzip it, and load in Chrome via `chrome://extensions/` (Enable Developer Mode → Load Unpacked)

   See [README](https://github.com/baryon/x-copilot#installation) for detailed instructions.
   ```

5. **Attach files**: Upload `releases/x-copilot-v*.*.*.zip`

6. Click **Publish release**

## After Release

- [ ] Test installation from the GitHub Release
- [ ] Update README if needed
- [ ] Announce on social media or relevant channels

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (e.g., 5.0.0): Breaking changes
- **MINOR** (e.g., 4.2.0): New features, backwards compatible
- **PATCH** (e.g., 4.1.1): Bug fixes

## Notes

- The `dist/` folder is in `.gitignore` - never commit it to the repository
- Only the zipped release package should be uploaded to GitHub Releases
- Keep release notes user-focused (what changed, not how it was implemented)
