# CROP AND RESIZE IMAGES

This app is designed for people who want to crop an image for multiple different use cases that require different sizes (e.g., 1920x1080, 1280x720, 260x480) and formats (e.g., jpg, png, webp).

## Target names and size
- Toppbild: 1932x828
- Brödtextbild: 1200x800
- LinkedIn, liggande: 1200x628
- LinkedIn, kvadratisk: 1200x1200
- LinkedIn, stående (4:5): 1200x628
- Instagram, kvadratisk: 1080x1080
- Instagram, stående (4:5): 1080x1350
- Instagram Story (9:16): 1080x1920
- Nyhetsbrev, stor: 600x300
- Nyhetsbrev, liten: 270x170

## Flow

1. The user uploads an image. This should work with both drag-and-drop and a file picker.
2. The user selects a target size from a list of predefined sizes.
3. A rectangle with the same aspect ratio as the target size is displayed on the image showing where the image will be cropped.
4. The user can move the rectangle and change its size.
5. The user can click "Crop" to crop the image.
6. Target format can be selected from a list of predefined formats.
7. The user can download the cropped image in the selected format.

## Tech Stack

See TECH.md for technology choices and workflow.