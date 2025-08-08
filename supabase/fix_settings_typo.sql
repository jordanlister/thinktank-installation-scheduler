-- Fix the typo in existing project_settings data
UPDATE project_settings 
SET scheduling_defaults = jsonb_set(
  scheduling_defaults #- '{maxJobsPerPage}',
  '{maxJobsPerDay}',
  scheduling_defaults->'maxJobsPerPage'
)
WHERE scheduling_defaults ? 'maxJobsPerPage';