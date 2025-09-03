# Image Flashcard JS

A JavaScript library for creating interactive visual quizzes on educational diagrams and images.

## Features

- **Progressive disclosure**: Clean images first, interactive quiz on demand
- **Visual quiz creation**: Click-and-drag designer tool for educators
- **Flexible positioning**: Controls can be positioned top, bottom, left, or right with fine-tuning offsets
- **Group organization**: Organize quiz elements by category (enzymes, products, diseases, etc.)
- **No dependencies**: Pure JavaScript, works with any website

## Quick Start

### 1. Include the Library

```html
<script src="image-flashcard.js"></script>
```

### 2. Create a Visual Quiz

```html
<!-- Your educational image with quiz configuration -->
<div data-quiz-config="path/to/your-config.json">
    <img src="your-diagram.jpg" alt="Educational Diagram">
</div>
```

### 3. Create Quiz Configuration

Use the **Image Flashcard Designer** tool (`image-flashcard-designer.html`) to:
- Upload your educational image
- Click to create quiz areas
- Group related elements
- Add labels and detailed answers
- Export configuration and image files

## Documentation

See [integration-guide.md](integration-guide.md) for complete setup and usage instructions.

## Running Examples & Designer Tool

**⚠️ Important**: The examples and designer tool must be served via HTTP (not opened directly in browser) due to browser security restrictions when loading JSON files.

### Start a Local HTTP Server

Choose one of these commands in the project directory:

```bash
# Python 3 (most common)
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have npm installed)
npx serve .

# PHP
php -S localhost:8000
```

Then visit:
- **Examples**: `http://localhost:8000/examples/example.html`
- **Designer Tool**: `http://localhost:8000/image-flashcard-designer.html`

## Example

Check the `/examples` folder for a complete urea cycle pathway quiz example.

## License

MIT License - Feel free to use in educational projects.