#!/usr/bin/env python3
"""
Tavvy Atlas Bulk Article Import Script
======================================
Imports articles from CSV files into the Supabase atlas_articles table.

Usage:
    python atlas_bulk_import.py <csv_file> [--dry-run] [--update]

Options:
    --dry-run    Validate CSV without inserting into database
    --update     Update existing articles (by slug) instead of skipping

CSV Format:
    Required columns: title, slug, author, excerpt, category_slug, content_blocks
    Optional columns: section_images, cover_image_url, read_time_minutes, 
                      article_template_type, seo_meta_description, seo_keywords,
                      is_featured, status

Example:
    python atlas_bulk_import.py articles.csv
    python atlas_bulk_import.py articles.csv --dry-run
    python atlas_bulk_import.py articles.csv --update
"""

import csv
import json
import sys
import os
import uuid
from datetime import datetime
from typing import Optional, Dict, List, Any

# Supabase configuration - uses environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL', os.environ.get('EXPO_PUBLIC_SUPABASE_URL', ''))
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', os.environ.get('SUPABASE_ANON_KEY', os.environ.get('EXPO_PUBLIC_SUPABASE_ANON_KEY', '')))

# Category slug to ID mapping (will be loaded from database)
CATEGORY_MAP = {}

def load_categories(supabase) -> Dict[str, str]:
    """Load category slug to ID mapping from database."""
    response = supabase.table('atlas_categories').select('id, slug').execute()
    return {cat['slug']: cat['id'] for cat in response.data}

def validate_content_blocks(blocks: List[Dict]) -> List[str]:
    """Validate content blocks structure."""
    errors = []
    valid_types = ['heading', 'paragraph', 'image', 'list', 'bullet_list', 'numbered_list', 
                   'place_card', 'itinerary', 'itinerary_day', 'callout', 'checklist', 
                   'quote', 'divider']
    
    for i, block in enumerate(blocks):
        if 'type' not in block:
            errors.append(f"Block {i+1}: missing 'type' field")
        elif block['type'] not in valid_types:
            errors.append(f"Block {i+1}: invalid type '{block['type']}'")
    
    return errors

def parse_csv_row(row: Dict, row_num: int) -> tuple[Optional[Dict], List[str]]:
    """Parse a CSV row and return article data and any errors."""
    errors = []
    
    # Required fields
    required = ['title', 'slug', 'content_blocks']
    for field in required:
        if not row.get(field):
            errors.append(f"Row {row_num}: missing required field '{field}'")
    
    if errors:
        return None, errors
    
    # Parse content_blocks JSON
    try:
        content_blocks = json.loads(row['content_blocks'])
        block_errors = validate_content_blocks(content_blocks)
        errors.extend([f"Row {row_num}: {e}" for e in block_errors])
    except json.JSONDecodeError as e:
        errors.append(f"Row {row_num}: invalid content_blocks JSON - {e}")
        return None, errors
    
    # Parse section_images JSON if present
    section_images = None
    if row.get('section_images'):
        try:
            section_images = json.loads(row['section_images'])
        except json.JSONDecodeError as e:
            errors.append(f"Row {row_num}: invalid section_images JSON - {e}")
    
    # Parse seo_keywords if present
    seo_keywords = None
    if row.get('seo_keywords'):
        try:
            seo_keywords = json.loads(row['seo_keywords']) if row['seo_keywords'].startswith('[') else row['seo_keywords'].split(',')
        except:
            seo_keywords = row['seo_keywords'].split(',')
    
    # Look up category ID
    category_id = None
    if row.get('category_slug'):
        category_id = CATEGORY_MAP.get(row['category_slug'])
        if not category_id:
            errors.append(f"Row {row_num}: unknown category_slug '{row['category_slug']}'")
    
    # Calculate read time if not provided
    read_time = int(row.get('read_time_minutes', 0)) or None
    if not read_time and content_blocks:
        # Estimate: ~200 words per minute, ~5 words per block
        word_count = sum(len(str(b.get('text', '')).split()) for b in content_blocks)
        read_time = max(1, word_count // 200)
    
    # Build article data
    article = {
        'title': row['title'],
        'slug': row['slug'],
        'excerpt': row.get('excerpt', ''),
        'content': row.get('excerpt', ''),  # Legacy content field
        'content_blocks': content_blocks,
        'section_images': section_images,
        'author_name': row.get('author', 'Tavvy Atlas Team'),
        'category_id': category_id,
        'read_time_minutes': read_time,
        'article_template_type': row.get('article_template_type', 'city_guide'),
        'cover_image_url': row.get('cover_image_url'),
        'seo_meta_description': row.get('seo_meta_description'),
        'seo_keywords': seo_keywords,
        'is_featured': row.get('is_featured', '').lower() in ('true', '1', 'yes'),
        'status': row.get('status', 'published'),
        'updated_at': datetime.utcnow().isoformat(),
    }
    
    return article, errors

def import_articles(csv_path: str, dry_run: bool = False, update_existing: bool = False):
    """Import articles from CSV file."""
    global CATEGORY_MAP
    
    # Check if file exists
    if not os.path.exists(csv_path):
        print(f"Error: File not found: {csv_path}")
        sys.exit(1)
    
    # Initialize Supabase client
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase credentials not found.")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        print("Or copy your .env file to this directory.")
        sys.exit(1)
    
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except ImportError:
        print("Error: supabase-py not installed. Run: pip install supabase")
        sys.exit(1)
    
    # Load categories
    print("Loading categories from database...")
    CATEGORY_MAP = load_categories(supabase)
    print(f"Found {len(CATEGORY_MAP)} categories: {', '.join(CATEGORY_MAP.keys())}")
    
    # Read and parse CSV
    print(f"\nReading CSV file: {csv_path}")
    articles = []
    all_errors = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
            article, errors = parse_csv_row(row, row_num)
            all_errors.extend(errors)
            if article:
                articles.append(article)
    
    # Report validation results
    print(f"\nValidation Results:")
    print(f"  - Total rows: {len(articles) + len([e for e in all_errors if 'missing required' in e])}")
    print(f"  - Valid articles: {len(articles)}")
    print(f"  - Errors: {len(all_errors)}")
    
    if all_errors:
        print("\nErrors found:")
        for error in all_errors[:20]:  # Show first 20 errors
            print(f"  - {error}")
        if len(all_errors) > 20:
            print(f"  ... and {len(all_errors) - 20} more errors")
    
    if dry_run:
        print("\n[DRY RUN] No changes made to database.")
        return
    
    if not articles:
        print("\nNo valid articles to import.")
        return
    
    # Check for existing articles
    slugs = [a['slug'] for a in articles]
    existing = supabase.table('atlas_articles').select('slug').in_('slug', slugs).execute()
    existing_slugs = {r['slug'] for r in existing.data}
    
    new_articles = [a for a in articles if a['slug'] not in existing_slugs]
    update_articles = [a for a in articles if a['slug'] in existing_slugs]
    
    print(f"\nImport Plan:")
    print(f"  - New articles to insert: {len(new_articles)}")
    print(f"  - Existing articles to {'update' if update_existing else 'skip'}: {len(update_articles)}")
    
    # Insert new articles
    if new_articles:
        print(f"\nInserting {len(new_articles)} new articles...")
        for article in new_articles:
            article['id'] = str(uuid.uuid4())
            article['created_at'] = datetime.utcnow().isoformat()
            article['published_at'] = datetime.utcnow().isoformat()
        
        try:
            result = supabase.table('atlas_articles').insert(new_articles).execute()
            print(f"  ✓ Inserted {len(result.data)} articles")
        except Exception as e:
            print(f"  ✗ Error inserting articles: {e}")
    
    # Update existing articles if requested
    if update_existing and update_articles:
        print(f"\nUpdating {len(update_articles)} existing articles...")
        success_count = 0
        for article in update_articles:
            slug = article.pop('slug')
            try:
                supabase.table('atlas_articles').update(article).eq('slug', slug).execute()
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error updating '{slug}': {e}")
        print(f"  ✓ Updated {success_count} articles")
    
    print("\n✓ Import complete!")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    csv_path = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    update_existing = '--update' in sys.argv
    
    import_articles(csv_path, dry_run, update_existing)

if __name__ == '__main__':
    main()
