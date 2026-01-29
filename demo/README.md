# RSS Generator Demo Data

This folder contains test data to validate the application's functionality.

## Structure

```
demo/
├── data/
│   ├── posts.json    # 5 demo posts
│   └── config.json   # Feed configuration
├── rss/
│   └── feed.xml      # Pre-generated RSS feed
└── README.md
```

## Usage

### Local Demo Mode

To use demo data locally:

```bash
# Copy data to server
cp -r demo/data/* server/data/
cp -r demo/rss/* server/rss/

# Start the application
npm run dev
```

### GitHub Pages

The GitHub Action `ci.yml` automatically deploys a static version on GitHub Pages with demo data.

## Test Data

### Included Posts

1. **Welcome to RSS Generator** - Introduction to the application
2. **Best Practices for RSS** - Optimization tips
3. **What's New in v1.0** - Feature changelog
4. **Integration Guide** - Technical tutorial
5. **Webinar** - Event example

### Media

All images use **Unsplash** resources (royalty-free license):
- Thumbnails: 800x600px
- Additional media: 600x400px

## Validation

The RSS feed is validated by:
- `xmllint` for XML syntax
- Required RSS element verification
- Server read test
