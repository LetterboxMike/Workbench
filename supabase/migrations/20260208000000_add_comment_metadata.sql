-- Add metadata column to comments table for anchors, mentions, and task conversion tracking
ALTER TABLE comments
ADD COLUMN metadata JSONB DEFAULT NULL;

-- Add index for converted task lookups
CREATE INDEX IF NOT EXISTS idx_comments_metadata_task
ON comments USING GIN ((metadata->'converted_to_task_id'));

-- Add index for mention lookups
CREATE INDEX IF NOT EXISTS idx_comments_metadata_mentions
ON comments USING GIN ((metadata->'mentioned_user_ids'));

-- Add comment for documentation
COMMENT ON COLUMN comments.metadata IS 'Stores anchor positions, mentioned user IDs, and task conversion tracking';
