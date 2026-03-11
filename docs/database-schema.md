# Database Schema Documentation

## Core Tables

### profiles
- `id` (uuid, PK) - Links to auth.users.id
- `created_datetime_utc` (timestamp)
- `first_name` (text)
- `last_name` (text)
- `email` (text)
- `is_superadmin` (boolean) - Controls admin panel access

### images
- `id` (uuid, PK)
- `created_datetime_utc` (timestamp)
- `url` (text) - CDN URL for the image
- `image_description` (text)
- `is_public` (boolean)
- `is_common_use` (boolean)
- `profile_id` (uuid, FK → profiles)

### captions
- `id` (uuid, PK)
- `created_datetime_utc` (timestamp)
- `content` (text) - The caption text
- `is_public` (boolean)
- `is_featured` (boolean)
- `like_count` (integer)
- `image_id` (uuid, FK → images)
- `profile_id` (uuid, FK → profiles)
- `humor_flavor_id` (integer, FK → humor_flavors)

### caption_votes
- `id` (uuid, PK)
- `created_datetime_utc` (timestamp)
- `profile_id` (uuid, FK → profiles)
- `caption_id` (uuid, FK → captions)
- `vote_value` (integer) - 1 for upvote, -1 for downvote

### caption_requests
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `profile_id` (uuid, FK → profiles)
- `image_id` (uuid, FK → images)

### caption_examples
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `modified_datetime_utc` (timestamp, nullable)
- `image_description` (text)
- `caption` (text)
- `explanation` (text)
- `priority` (integer)
- `image_id` (uuid, FK → images, nullable)

---

## Humor System Tables

### humor_flavors
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `description` (text)
- `slug` (text)

### humor_flavor_steps
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `humor_flavor_id` (integer, FK → humor_flavors)
- `llm_temperature` (float)
- `order_by` (integer)
- `llm_input_type_id` (integer, FK → llm_input_types)
- `llm_output_type_id` (integer, FK → llm_output_types)
- `llm_model_id` (integer, FK → llm_models)
- `humor_flavor_step_type_id` (integer)
- `llm_system_prompt` (text)
- `llm_user_prompt` (text)
- `description` (text)

### humor_flavor_mix
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `humor_flavor_id` (integer, FK → humor_flavors)
- `caption_count` (integer)

---

## Terms Tables

### terms
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `modified_datetime_utc` (timestamp, nullable)
- `term` (text)
- `definition` (text)
- `example` (text)
- `priority` (integer)
- `term_type_id` (integer, FK → term_types)

### term_types
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `name` (text) - e.g., "Verb", "Noun"

---

## LLM Tables

### llm_providers
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `name` (text) - e.g., "OpenAI"

### llm_models
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `name` (text) - e.g., "Grok-2-vision"
- `llm_provider_id` (integer, FK → llm_providers)
- `provider_model_id` (text) - e.g., "grok-2-vision"
- `is_temperature_supported` (boolean)

### llm_input_types
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `description` (text)
- `slug` (text) - e.g., "text-only"

### llm_output_types
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `description` (text)
- `slug` (text) - e.g., "string"

### llm_prompt_chains
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `caption_request_id` (integer, FK → caption_requests)

### llm_model_responses
- `id` (uuid, PK)
- `created_datetime_utc` (timestamp)
- `llm_model_response` (text) - The actual LLM response
- `processing_time_seconds` (integer)
- `llm_model_id` (integer, FK → llm_models)
- `profile_id` (uuid, FK → profiles)
- `caption_request_id` (integer, FK → caption_requests)
- `llm_system_prompt` (text)
- `llm_user_prompt` (text)
- `llm_temperature` (float)
- `humor_flavor_id` (integer, FK → humor_flavors)
- `llm_prompt_chain_id` (integer, FK → llm_prompt_chains)
- `humor_flavor_step_id` (integer, FK → humor_flavor_steps)

---

## Access Control Tables

### allowed_signup_domains
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `apex_domain` (text) - e.g., "barnard.edu", "columbia.edu"

### whitelist_email_addresses
- `id` (integer, PK)
- `created_datetime_utc` (timestamp)
- `modified_datetime_utc` (timestamp, nullable)
- `email_address` (text)

---

## Common Joins

```sql
-- Captions with images
SELECT c.*, i.url as image_url 
FROM captions c 
LEFT JOIN images i ON c.image_id = i.id;

-- Caption votes aggregated
SELECT caption_id, 
       SUM(CASE WHEN vote_value = 1 THEN 1 ELSE 0 END) as upvotes,
       SUM(CASE WHEN vote_value = -1 THEN 1 ELSE 0 END) as downvotes
FROM caption_votes 
GROUP BY caption_id;

-- Humor flavor steps with model info
SELECT hfs.*, lm.name as model_name, lp.name as provider_name
FROM humor_flavor_steps hfs
LEFT JOIN llm_models lm ON hfs.llm_model_id = lm.id
LEFT JOIN llm_providers lp ON lm.llm_provider_id = lp.id;

-- Terms with types
SELECT t.*, tt.name as type_name
FROM terms t
LEFT JOIN term_types tt ON t.term_type_id = tt.id;
```
