# Monash DataConnect interactive prototype

This repository contains a static, mobile-first interactive prototype assembled from Google Stitch screen exports.

## Run locally

From this directory:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Publish with GitHub Pages

1. Push the contents of this folder to the default branch of a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the default branch and the root folder, then save.

## Prototype notes

- The desktop presentation uses an iPhone-style frame.
- On narrow mobile screens, the prototype automatically becomes full screen.
- The main journey and bottom navigation are connected.
- Authentication, network measurements and submissions are simulated for prototype demonstration only.
- The Stitch export currently loads fonts, icons and generated images from external Google-hosted URLs, so an internet connection is required.
