-- Photo Jury Intelligence
-- PostgreSQL 16+ target schema for the SWPA pilot.
-- The runnable POC stores the same entities in src/lib/data/seed.ts.
-- This file is not applied automatically.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    page_title TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL,
    content_hash TEXT,
    raw_content_snapshot TEXT,
    parser_version TEXT NOT NULL,
    extraction_version TEXT NOT NULL,
    collection_mode TEXT NOT NULL CHECK (collection_mode IN ('curated_seed', 'live_http'))
);

CREATE TABLE competitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_zh TEXT NOT NULL,
    organizer TEXT NOT NULL,
    homepage_url TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE competition_editions (
    id TEXT PRIMARY KEY,
    competition_id TEXT NOT NULL REFERENCES competitions(id),
    year INTEGER NOT NULL,
    edition_number INTEGER,
    official_label TEXT NOT NULL,
    winners_complete BOOLEAN NOT NULL,
    submission_note TEXT,
    source_id TEXT NOT NULL REFERENCES sources(id),
    UNIQUE (competition_id, year)
);

CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    competition_id TEXT NOT NULL REFERENCES competitions(id),
    normalized_track TEXT NOT NULL CHECK (normalized_track IN ('series', 'single_image', 'student', 'youth')),
    raw_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    mapping_version TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id),
    UNIQUE (competition_id, normalized_track, raw_name)
);

CREATE TABLE edition_categories (
    id TEXT PRIMARY KEY,
    edition_id TEXT NOT NULL REFERENCES competition_editions(id),
    category_id TEXT NOT NULL REFERENCES categories(id),
    brief TEXT,
    note TEXT,
    UNIQUE (edition_id, category_id)
);

CREATE TABLE awards (
    id TEXT PRIMARY KEY,
    edition_id TEXT NOT NULL REFERENCES competition_editions(id),
    normalized_track TEXT NOT NULL,
    name TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('overall', 'category')),
    rank INTEGER NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE photographers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT,
    name_note TEXT,
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE image_assets (
    id TEXT PRIMARY KEY,
    official_image_url TEXT,
    rights_status TEXT NOT NULL CHECK (rights_status IN ('rights_blocked', 'official_url_only', 'licensed', 'placeholder')),
    rights_note TEXT NOT NULL,
    hosted_binary BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (hosted_binary = FALSE OR rights_status = 'licensed')
);

CREATE TABLE photographs (
    id TEXT PRIMARY KEY,
    title TEXT,
    edition_id TEXT NOT NULL REFERENCES competition_editions(id),
    category_id TEXT NOT NULL REFERENCES categories(id),
    description TEXT,
    official_page_url TEXT NOT NULL,
    image_asset_id TEXT NOT NULL REFERENCES image_assets(id),
    role TEXT NOT NULL CHECK (role IN ('standalone', 'series_frame')),
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE photograph_series (
    id TEXT PRIMARY KEY,
    edition_id TEXT NOT NULL REFERENCES competition_editions(id),
    title TEXT,
    description TEXT,
    category_id TEXT NOT NULL REFERENCES categories(id),
    official_source_url TEXT NOT NULL,
    image_count INTEGER,
    image_count_note TEXT NOT NULL,
    image_asset_id TEXT NOT NULL REFERENCES image_assets(id),
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE series_images (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL REFERENCES photograph_series(id) ON DELETE CASCADE,
    photograph_id TEXT NOT NULL REFERENCES photographs(id),
    sequence_number INTEGER NOT NULL,
    UNIQUE (series_id, sequence_number),
    UNIQUE (series_id, photograph_id)
);

CREATE TABLE photograph_awards (
    id TEXT PRIMARY KEY,
    award_id TEXT NOT NULL REFERENCES awards(id),
    series_id TEXT REFERENCES photograph_series(id),
    photograph_id TEXT REFERENCES photographs(id),
    source_id TEXT NOT NULL REFERENCES sources(id),
    CHECK ((series_id IS NOT NULL) <> (photograph_id IS NOT NULL))
);

CREATE TABLE juries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE jury_assignments (
    id TEXT PRIMARY KEY,
    jury_id TEXT NOT NULL REFERENCES juries(id),
    edition_id TEXT NOT NULL REFERENCES competition_editions(id),
    role_title TEXT NOT NULL,
    institution TEXT,
    biography_excerpt TEXT,
    official_profile_url TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE jury_portfolios (
    id TEXT PRIMARY KEY,
    jury_id TEXT NOT NULL REFERENCES juries(id),
    url TEXT,
    title TEXT,
    note TEXT NOT NULL
);

CREATE TABLE jury_profiles (
    jury_id TEXT PRIMARY KEY REFERENCES juries(id),
    kind TEXT NOT NULL CHECK (kind = 'inference'),
    sample_status TEXT NOT NULL CHECK (sample_status IN ('insufficient', 'sufficient')),
    sample_count INTEGER NOT NULL,
    confidence NUMERIC,
    model_name TEXT,
    model_version TEXT,
    visual_style TEXT,
    common_subjects TEXT,
    color_tendency TEXT,
    composition_tendency TEXT,
    narrative_preference TEXT,
    thematic_mode TEXT,
    statement TEXT NOT NULL,
    CHECK (
        sample_status <> 'insufficient'
        OR (
            visual_style IS NULL
            AND color_tendency IS NULL
            AND composition_tendency IS NULL
            AND confidence IS NULL
        )
    )
);

CREATE TABLE image_analyses (
    id TEXT PRIMARY KEY,
    photograph_id TEXT REFERENCES photographs(id),
    series_id TEXT REFERENCES photograph_series(id),
    kind TEXT NOT NULL CHECK (kind = 'inference'),
    analysis_schema TEXT NOT NULL CHECK (analysis_schema IN ('single_image', 'series')),
    status TEXT NOT NULL,
    confidence NUMERIC,
    model_name TEXT,
    model_version TEXT,
    analyzed_at TIMESTAMPTZ,
    evidence_note TEXT NOT NULL,
    CHECK ((photograph_id IS NOT NULL) <> (series_id IS NOT NULL)),
    CHECK (
        (analysis_schema = 'single_image' AND photograph_id IS NOT NULL)
        OR (analysis_schema = 'series' AND series_id IS NOT NULL)
    )
);

CREATE TABLE collection_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    stage TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    completed_count INTEGER NOT NULL,
    failed_count INTEGER NOT NULL,
    current_item TEXT,
    error_log JSONB NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    idempotency_key TEXT NOT NULL
);

CREATE TABLE agent_runs (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES collection_tasks(id),
    stage TEXT NOT NULL,
    status TEXT NOT NULL,
    summary TEXT NOT NULL
);
