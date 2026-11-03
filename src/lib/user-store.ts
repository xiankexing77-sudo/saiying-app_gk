"use client";

import type {
  AnalysisResult,
  Favorite,
  Note,
  ScreenshotRef,
} from "@/lib/types";

const KEY = "saiying.local.v1";

export type LocalDb = {
  user_id: string;
  favorites: Favorite[];
  notes: Note[];
  screenshots: ScreenshotRef[];
  analysis_overrides: AnalysisResult[];
};

const serverDb: LocalDb = {
  user_id: "local-remi",
  favorites: [],
  notes: [],
  screenshots: [],
  analysis_overrides: [],
};

let snapshot: LocalDb = serverDb;
let hydrated = false;

function parse(raw: string | null): LocalDb {
  if (!raw) return serverDb;
  try {
    const parsed = JSON.parse(raw) as LocalDb;
    return {
      user_id: parsed.user_id || serverDb.user_id,
      favorites: parsed.favorites ?? [],
      notes: parsed.notes ?? [],
      screenshots: parsed.screenshots ?? [],
      analysis_overrides: parsed.analysis_overrides ?? [],
    };
  } catch {
    return serverDb;
  }
}

function read(): LocalDb {
  if (typeof window === "undefined") return serverDb;
  if (!hydrated) {
    hydrated = true;
    snapshot = parse(window.localStorage.getItem(KEY));
  }
  return snapshot;
}

function write(db: LocalDb) {
  snapshot = db;
  window.localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("saiying-db"));
}

export function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    snapshot = parse(event.newValue);
    listener();
  };
  const onLocal = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener("saiying-db", onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("saiying-db", onLocal);
  };
}

export function loadDb() {
  return read();
}

export function serverSnapshot() {
  return serverDb;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isFavorite(
  db: LocalDb,
  targetType: Favorite["target_type"],
  targetId: string,
) {
  return db.favorites.some(
    (item) => item.target_type === targetType && item.target_id === targetId,
  );
}

export function toggleFavorite(
  targetType: Favorite["target_type"],
  targetId: string,
) {
  const db = read();
  const existing = db.favorites.find(
    (item) => item.target_type === targetType && item.target_id === targetId,
  );
  const notesRemain = db.notes.some(
    (note) => note.target_type === targetType && note.target_id === targetId,
  );
  const now = new Date().toISOString();
  const favorites = existing
    ? db.favorites.filter((item) => item.id !== existing.id)
    : [
        {
          id: uid("fav"),
          user_id: db.user_id,
          target_type: targetType,
          target_id: targetId,
          created_at: now,
          updated_at: now,
        },
        ...db.favorites,
      ];
  write({ ...db, favorites });
  return { favorited: !existing, notesRemain: existing ? notesRemain : false };
}

export function notesFor(
  db: LocalDb,
  targetType: Note["target_type"],
  targetId: string,
) {
  return db.notes.filter(
    (note) => note.target_type === targetType && note.target_id === targetId,
  );
}

export function saveNote(
  targetType: Note["target_type"],
  targetId: string,
  body: string,
  noteId?: string,
) {
  const db = read();
  const now = new Date().toISOString();
  const text = body.trim();
  if (!text) return;
  const notes = noteId
    ? db.notes.map((note) =>
        note.id === noteId ? { ...note, body: text, updated_at: now } : note,
      )
    : [
        {
          id: uid("note"),
          user_id: db.user_id,
          target_type: targetType,
          target_id: targetId,
          body: text,
          created_at: now,
          updated_at: now,
        },
        ...db.notes,
      ];
  write({ ...db, notes });
}

export function deleteNote(noteId: string) {
  const db = read();
  write({ ...db, notes: db.notes.filter((note) => note.id !== noteId) });
}

export function addScreenshot(input: {
  target_type: ScreenshotRef["target_type"];
  target_id: string;
  source_url: string;
  local_ref: string;
}) {
  const db = read();
  write({
    ...db,
    screenshots: [
      {
        id: uid("shot"),
        target_type: input.target_type,
        target_id: input.target_id,
        source_url: input.source_url.trim(),
        local_ref: input.local_ref.trim(),
        captured_at: new Date().toISOString(),
        user_id: db.user_id,
      },
      ...db.screenshots,
    ],
  });
}

export function deleteScreenshot(id: string) {
  const db = read();
  write({
    ...db,
    screenshots: db.screenshots.filter((item) => item.id !== id),
  });
}

export function overrideFor(
  db: LocalDb,
  targetType: AnalysisResult["target_type"],
  targetId: string,
  kind: AnalysisResult["kind"],
) {
  return (
    db.analysis_overrides.find(
      (item) =>
        item.target_type === targetType &&
        item.target_id === targetId &&
        item.kind === kind,
    ) ?? null
  );
}

export function saveAnalysisOverride(result: AnalysisResult) {
  const db = read();
  write({
    ...db,
    analysis_overrides: [
      result,
      ...db.analysis_overrides.filter(
        (item) =>
          !(
            item.target_type === result.target_type &&
            item.target_id === result.target_id &&
            item.kind === result.kind
          ),
      ),
    ],
  });
}
