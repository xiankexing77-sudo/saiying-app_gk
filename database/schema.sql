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
    note TEXT NOT NULL,
    channel TEXT,
    group_id TEXT
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
            AND common_subjects IS NULL
            AND color_tendency IS NULL
            AND composition_tendency IS NULL
            AND narrative_preference IS NULL
            AND thematic_mode IS NULL
            AND confidence IS NULL
        )
    )
);

-- 样本组是本人单独发表的一套作品。同一套作品的多个页面写在 personal_sample_sources，不另计组。
-- 风格标签是推断。应用在样本组少于 3 时不写 style_tags，也不填写上面的偏好字段。

CREATE TABLE personal_sample_groups (
    id TEXT PRIMARY KEY,
    jury_id TEXT NOT NULL REFERENCES juries(id),
    title TEXT NOT NULL,
    year_label TEXT,
    authorship TEXT NOT NULL CHECK (authorship = 'own_work'),
    image_count INTEGER,
    image_count_note TEXT NOT NULL,
    rights_status TEXT NOT NULL CHECK (rights_status = 'rights_blocked'),
    hosted_binary BOOLEAN NOT NULL CHECK (hosted_binary = FALSE),
    official_image_url TEXT
);

CREATE TABLE personal_sample_sources (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES personal_sample_groups(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    page_title TEXT NOT NULL,
    channel TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL,
    content_hash TEXT,
    parser_version TEXT NOT NULL,
    extraction_version TEXT NOT NULL
);

CREATE TABLE personal_sample_claims (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES personal_sample_groups(id) ON DELETE CASCADE,
    claim_key TEXT NOT NULL,
    quote TEXT NOT NULL,
    source_url TEXT NOT NULL
);

CREATE TABLE style_tags (
    id TEXT PRIMARY KEY,
    jury_id TEXT NOT NULL REFERENCES juries(id),
    dimension TEXT NOT NULL,
    label TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('cross_group', 'single_group')),
    statement TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence <= 0.7),
    sample_count INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    CHECK (scope <> 'cross_group' OR sample_count >= 2),
    CHECK (scope <> 'single_group' OR sample_count = 1)
);

-- status 为 text_grounded 或 insufficient_text。pixels_read 在未授权、未保存原图时保持 false。
-- 非空维度必须能回到 analysis_evidence.quote，且 quote 是官方说明或用户说明的原句。
CREATE TABLE image_analyses (
    id TEXT PRIMARY KEY,
    photograph_id TEXT REFERENCES photographs(id),
    series_id TEXT REFERENCES photograph_series(id),
    kind TEXT NOT NULL CHECK (kind = 'inference'),
    analysis_schema TEXT NOT NULL CHECK (analysis_schema IN ('single_image', 'series')),
    status TEXT NOT NULL,
    basis TEXT,
    pixels_read BOOLEAN NOT NULL DEFAULT FALSE,
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

CREATE TABLE analysis_evidence (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL REFERENCES image_analyses(id) ON DELETE CASCADE,
    dimension TEXT NOT NULL,
    label TEXT NOT NULL,
    quote TEXT NOT NULL,
    source_url TEXT,
    rationale TEXT NOT NULL
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

-- Multi-source extracts and cross-validation.
-- One observation per source field. A conflict keeps every source value;
-- preferred_value is only the display choice, not a silent overwrite.

CREATE TABLE source_observations (
    id TEXT PRIMARY KEY,
    edition_year INTEGER NOT NULL,
    entity_key TEXT NOT NULL,
    entity_label TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_value TEXT,
    source_id TEXT NOT NULL REFERENCES sources(id),
    source_url TEXT NOT NULL,
    source_page_title TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL,
    content_hash TEXT,
    parser_version TEXT NOT NULL,
    extraction_version TEXT NOT NULL,
    source_role TEXT NOT NULL CHECK (source_role IN ('official_primary', 'official_related', 'organizer_mirror')),
    work_id TEXT,
    jury_id TEXT,
    note TEXT
);

CREATE TABLE field_validations (
    id TEXT PRIMARY KEY,
    edition_year INTEGER NOT NULL,
    entity_key TEXT NOT NULL,
    entity_label TEXT NOT NULL,
    field_name TEXT NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN ('agree', 'conflict', 'single_source')),
    preferred_value TEXT,
    preferred_source_id TEXT NOT NULL REFERENCES sources(id),
    preferred_source_url TEXT NOT NULL,
    preferred_reason TEXT NOT NULL,
    confidence NUMERIC,
    confidence_label TEXT NOT NULL,
    UNIQUE (edition_year, entity_key, field_name)
);
