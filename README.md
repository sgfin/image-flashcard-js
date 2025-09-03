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

## Example

Check the `/examples` folder for a complete urea cycle pathway quiz example.

## License

MIT License - Feel free to use in educational projects.