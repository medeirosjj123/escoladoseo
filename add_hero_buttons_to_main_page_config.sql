ALTER TABLE public.main_page_config
ADD COLUMN IF NOT EXISTS hero_watch_button_link TEXT,
ADD COLUMN IF NOT EXISTS hero_info_button_link TEXT;
