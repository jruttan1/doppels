# Database Schema

## Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK. Linked to Supabase Auth. |
| name | text | Display name for the dashboard. |
| persona | jsonb | The Soul File. Contains bio, voice_samples, and goals. |
| tagline | text | One sentence description, similar to linkedin headline |

## Simulations Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK. Unique simulation ID. |
| participant1 | uuid | FK. The user who requested the intro. |
| participant2 | uuid | FK. The target user. |
| score | int | 0-100 compatibility rating. |
| transcript | jsonb | The raw chat logs between the two agents. |
