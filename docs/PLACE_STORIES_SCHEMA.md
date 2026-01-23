# Place Stories Table Schema

## Table: `place_stories`

| Column | Data Type | Description |
|--------|-----------|-------------|
| id | uuid | Primary key |
| place_id | uuid | Foreign key to places table |
| user_id | uuid | User who created the story |
| media_url | text | URL to the story media (image/video) |
| media_type | text | Type of media (image/video) |
| caption | text | Optional caption for the story |
| created_at | timestamp with time zone | When the story was created |
| expires_at | timestamp with time zone | When the story expires (24h default) |
| thumbnail_url | text | Thumbnail for video stories |
| status | text | Status (active/expired/deleted) |
| is_permanent | boolean | If true, story doesn't expire (highlights) |
| tags | ARRAY | Tags associated with the story |
| updated_at | timestamp with time zone | Last update timestamp |

## Current Data
- Total stories: 0
- Active stories: 0

## Notes
- Stories expire after 24 hours unless `is_permanent` is true
- Media can be images or short videos
- Stories are associated with places (not users directly)
