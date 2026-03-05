# Supabase Database Schema Reference

This document contains the database schema details for the Supabase project.

## Connection Details

- **Project ID**: `qihsgnfjqmkjmoowyfbn`
- **Supabase URL**: `https://qihsgnfjqmkjmoowyfbn.supabase.co`
- **Image CDN**: `https://images.almostcrackd.ai/`

---

## Core Tables

### `profiles`

User profiles linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (matches auth.users.id) |
| `created_datetime_utc` | timestamp | Account creation time |
| `modified_datetime_utc` | timestamp | Last modification time |
| `first_name` | text | User's first name |
| `last_name` | text | User's last name |
| `email` | text | User's email |
| `is_superadmin` | boolean | Admin privileges |
| `is_in_study` | boolean | Part of research study |
| `is_matrix_admin` | boolean | Matrix admin role |

---

### `images`

Stores image metadata and URLs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_datetime_utc` | timestamp | When image was uploaded |
| `modified_datetime_utc` | timestamp | Last modification time |
| `url` | text | Full URL to image |
| `is_common_use` | boolean | Whether image is for common/shared use |
| `profile_id` | UUID | FK to profiles - who uploaded |
| `additional_context` | text | Extra context about the image |
| `is_public` | boolean | Whether image is publicly visible |
| `image_description` | text | AI-generated description of the image |
| `celebrity_recognition` | jsonb | Celebrity detection results |
| `embedding` | vector | Image embedding for similarity search |

**Image URL Pattern:**
```
https://images.almostcrackd.ai/{profile_id}/{image_id}.{extension}
```

---

### `captions`

Stores captions for images with vote counts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_datetime_utc` | timestamp | When caption was created |
| `modified_datetime_utc` | timestamp | Last modification time |
| `content` | text | The caption text |
| `is_public` | boolean | Whether caption is publicly visible |
| `profile_id` | UUID | FK to profiles - who created the caption |
| `image_id` | UUID | FK to images table |
| `humor_flavor_id` | integer | FK to humor_flavors (nullable) |
| `is_featured` | boolean | Shows on landing page if true |
| `caption_request_id` | integer | FK to caption_requests (nullable) |
| `like_count` | integer | Aggregated vote count |
| `llm_prompt_chain_id` | integer | FK to llm_prompt_chains (nullable) |

---

### `caption_votes`

Stores each upvote/downvote for each caption.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key (auto-increment) |
| `created_datetime_utc` | timestamp | When vote was cast |
| `modified_datetime_utc` | timestamp | Last modification time |
| `vote_value` | integer | 1 for upvote, -1 for downvote |
| `profile_id` | UUID | FK to profiles - who voted |
| `caption_id` | UUID | FK to captions - which caption |

---

## Notes

- Images are stored externally at `images.almostcrackd.ai`, not in Supabase Storage
- Most tables have Row Level Security (RLS) enabled
- The `profiles` table is linked to Supabase Auth users via `id`
- Vote values: `1` = upvote, `-1` = downvote
- Timestamps use UTC timezone
