# Places Table Schema

Columns in the `places` table:

| Column Name | Data Type |
|-------------|-----------|
| id | uuid |
| source_type | text |
| source_id | text |
| name | text |
| street | text |
| city | text |
| region | text |
| country | text |
| postcode | text |
| location | USER-DEFINED (PostGIS) |
| tavvy_category | text |
| tavvy_subcategory | text |
| status | text |
| phone | text |
| website | text |
| cover_image_url | text |
| photos | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| latitude | double precision |
| longitude | double precision |
| is_active | boolean |

## Key Notes

- **NO `address` column** - Use `street` instead
- **NO `email`, `instagram`, `facebook`, `twitter` columns** - These don't exist
- `latitude` and `longitude` columns DO exist
- `location` is a PostGIS geography/geometry type
