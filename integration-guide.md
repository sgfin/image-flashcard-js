# How to Integrate Visual Quizzes into Your Site

This guide shows you how to take a configuration created with the **Image Flashcard Designer** and integrate interactive visual quizzes into your existing pages using the `image-flashcard-js` library.

> **Note:** This library is planned to be released as a standalone GitHub repository `image-flashcard-js` for easy integration into any website. The Image Flashcard Designer tool will also be available separately for creating quiz configurations.

## Important: HTTP Server Required

**⚠️ Critical**: The Image Flashcard Designer and examples must be served via HTTP (not opened directly in browser) due to browser security restrictions when loading JSON files.

### Start a Local HTTP Server

Run one of these commands in the project directory:

```bash
# Python 3 (recommended)
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve .

# PHP  
php -S localhost:8000
```

Then access:
- **Designer Tool**: `http://localhost:8000/image-flashcard-designer.html`
- **Examples**: `http://localhost:8000/examples/example.html`

## Step-by-Step Process

### 1. Create Your Flashcard Configuration

1. Open the **Image Flashcard Designer** at `http://localhost:8000/image-flashcard-designer.html`
2. Upload your pathway diagram or educational image
3. Create flashcard areas by clicking on important regions
4. Group related areas (enzymes, substrates, diseases, etc.)
5. Add labels and detailed answers for each flashcard
6. Click "Save Config" and enter a descriptive filename (e.g., "urea-cycle-flashcards")

This will download two files:
- `urea-cycle-flashcards.json` (the flashcard configuration)
- `urea-cycle-flashcards.jpg` (the renamed image file)

### 2. Organize Your Files

## Installation

### Option 1: From GitHub (Recommended for future)
```bash
# When available as a separate repo
npm install image-flashcard-js
# or
yarn add image-flashcard-js
```

### Option 2: Direct Files (Current setup)
```
your-site/
├── js/
│   └── image-flashcard.js           # Runtime script
├── images/
│   └── urea-cycle-flashcards.jpg    # Your flashcard image
├── configs/
│   └── urea-cycle-flashcards.json   # Your flashcard config
└── your-page.html                   # Your content page
```

### 3. Add Visual Quiz to Your HTML Page

#### Method 1: Basic Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Page</title>
</head>
<body>
    <h1>Urea Cycle Pathway</h1>
    
    <!-- Quiz Image Container -->
    <div data-quiz-config="configs/urea-cycle-quiz.json">
        <img src="figures/urea-cycle-quiz.jpg" alt="Urea Cycle Pathway">
    </div>
    
    <p>Additional content about the urea cycle...</p>
    
    <!-- Include the image-flashcard-js library -->
    <script src="js/image-flashcard.js"></script>
</body>
</html>
```

#### Method 2: Integration with Existing Content

If you already have an image on your page, simply add the quiz functionality:

```html
<!-- Before: Just a regular image -->
<img src="figures/urea_cycle.jpg" alt="Urea Cycle">

<!-- After: Interactive visual quiz -->
<div data-quiz-config="configs/urea-cycle-quiz.json">
    <img src="figures/urea-cycle-quiz.jpg" alt="Urea Cycle">
</div>
<script src="js/image-flashcard.js"></script>
```

### 4. Visual Quiz Experience

The visual quiz provides a clean, progressive experience:

#### **Initial State**
- Users see a **clean image** with no quiz annotations
- Single **"Show Image Quiz"** button (positioned according to your settings)
- No visual clutter - perfect for first viewing the diagram

#### **Interactive Mode** (after clicking "Show Image Quiz")
- **All quiz boxes appear** on the image with group labels
- **Full control panel** becomes available:
  - **Reset** - Shows all boxes with their labels  
  - **Show All** - Reveals all answers
  - **Group Toggles** - Hide/show entire groups (e.g., "Hide Enzymes")
  - **Hide Quiz** - Return to clean image
- Users can click individual boxes to reveal answers one by one

#### **Controls Positioning**
- Controls default to **right side** of the image
- Position can be customized: top, bottom, left, or right
- Fine-tune with X/Y offsets for perfect placement

## Example: Adding to Hyperammonemia Page

Let's say you want to add a urea cycle quiz to your `0_hyperammonemia.html` page:

### 1. Current Page Structure
```html
<!-- In 0_hyperammonemia.html -->
<h2>Urea Cycle Defects</h2>
<img src="figures/urea_cycle.jpg" alt="Urea Cycle">
<p>The urea cycle converts toxic ammonia...</p>
```

### 2. Updated with Quiz
```html
<!-- In 0_hyperammonemia.html -->
<h2>Urea Cycle Defects</h2>

<!-- Interactive Quiz Version -->
<div data-quiz-config="configs/urea-cycle-quiz.json">
    <img src="figures/urea-cycle-quiz.jpg" alt="Urea Cycle">
</div>

<p>The urea cycle converts toxic ammonia...</p>

<!-- Add at bottom of page -->
<script src="image-flashcard.js"></script>
```

## Configuration File Format

Your saved config includes:

```json
{
  "image": "urea-cycle-quiz.jpg",
  "imageDisplayDimensions": {
    "width": 600,
    "height": 400
  },
  "groups": {
    "enzymes": {
      "name": "Enzymes",
      "color": "#ff6b6b"
    }
  },
  "boxes": [
    {
      "id": "box1",
      "label": "CPS1",
      "answer": "Carbamoyl Phosphate Synthetase I",
      "x": 25, "y": 15, "width": 8, "height": 6,
      "group": "enzymes"
    }
  ],
  "controlsPosition": "right",
  "controlsOffsetX": 0,
  "controlsOffsetY": 0
}
```

## Multiple Visual Quizzes

You can have multiple visual quizzes on the same page:

```html
<div data-quiz-config="configs/urea-cycle-quiz.json">
    <img src="figures/urea-cycle-quiz.jpg" alt="Urea Cycle">
</div>

<div data-quiz-config="configs/fatty-acid-synthesis-quiz.json">
    <img src="figures/fatty-acid-synthesis-quiz.jpg" alt="Fatty Acid Synthesis">
</div>

<script src="image-flashcard.js"></script>
```

## Troubleshooting

### Quiz Not Appearing
- **Most Common**: Are you serving via HTTP? Quiz files must be served from a web server, not opened directly in browser
- Check that `image-flashcard.js` is included and loading properly
- Verify the config file path is correct
- Ensure the image loads before the script runs
- Check browser console for "CORS" or "fetch" errors indicating file:// protocol issues

### Boxes in Wrong Positions
- Make sure the image file hasn't been resized or cropped
- The `imageDisplayDimensions` in the config should match your page's image size
- If needed, recreate the quiz with the correctly sized image

### Image Appears Too Small
- Check the `max-width` in your HTML `<img>` tag
- The quiz respects your HTML styling - increase `max-width` to allow larger display
- Example: `<img src="quiz-image.jpg" style="max-width: 700px; height: auto;">`
- The `imageDisplayDimensions` in config affects box positioning, not display size

### Config File Not Loading
- Check that the file path is correct relative to your HTML page
- Ensure the JSON syntax is valid
- Verify the server can serve JSON files (some servers block .json files)

## Best Practices

1. **Consistent Naming**: Use descriptive, consistent filenames
   - `urea-cycle-quiz.json` + `urea-cycle-quiz.jpg`
   - `glycolysis-quiz.json` + `glycolysis-quiz.jpg`

2. **File Organization**: Keep configs and images in dedicated directories
   ```
   ├── configs/         # All .json config files
   ├── figures/         # All image files
   └── pages/          # Your HTML pages
   ```

3. **Image Sizing**: Create quizzes with images at the size they'll be displayed
   - Avoid major size differences between design and display
   - Use consistent image dimensions across your site

4. **Testing**: Always test quizzes on different screen sizes
   - Desktop, tablet, and mobile
   - Different browsers

## Advanced Integration

### Custom Styling
Override the default quiz styles by adding CSS:

```css
/* Customize quiz buttons */
.quiz-btn {
    background: your-color;
    border-radius: 8px;
}

/* Customize box appearance */
.quiz-box-runtime {
    font-family: your-font;
}
```

### JavaScript Integration
Access quiz functionality programmatically:

```javascript
// Wait for quiz to initialize
document.addEventListener('DOMContentLoaded', () => {
    // Quiz instances are automatically created
    // You can extend functionality here
});
```

This integration system makes it easy to add interactive quizzes to any existing educational content while maintaining clean, semantic HTML.