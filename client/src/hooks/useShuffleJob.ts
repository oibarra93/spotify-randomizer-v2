import { useCallback, useMemo, useRef, useState } from "react";
import type { SimplifiedPlaylist } from "../api/spotify/types";
import { createRandomizedPlaylist } from "../features/shuffle/createRandomized";
import type { ShuffleJobProgress, ShuffleJobResult } from "../features/shuffle/jobTypes";
import type { shuffleSource as ShuffleSource } from "../features/shuffle/types";

export type ShuffleJobState =
  | { status: "idle" }
  | { status: "running"; progress: ShuffleJobProgress }
  | { status: "done"; result: ShuffleJobResult }
  | { status: "error"; message: string };

function formatDateStamp(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function defaultNameForSource(source: ShuffleSource): string {
  if (source.kind === "Liked") return `Randomized • Liked Songs • ${formatDateStamp()}`;
  return `Randomized • ${source.playListName ?? "Playlist"} • ${formatDateStamp()}`;
}

export function useShuffleJob() {
  const [state, setState] = useState<ShuffleJobState>({ status: "idle" });

  const abortRef = useRef<AbortController | null>(null);
  const running = state.status === "running";

  const cancel = useCallback(() => {
    abortRef.current?.abort(new DOMException("Cancelled", "AbortError"));
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (running) return;
    setState({ status: "idle" });
  }, [running]);

  const startWithOptions = useCallback(
    async (opts: { source: ShuffleSource; name?: string }) => {
      if (running) return;

      const ac = new AbortController();
      abortRef.current = ac;

      const name = opts.name && opts.name.trim() ? opts.name.trim() : defaultNameForSource(opts.source);

      setState({ status: "running", progress: { stage: "init", source: opts.source } });

      try {
        const result = await createRandomizedPlaylist({
          source: opts.source,
          name,
          description: "Created by Spotify Randomizer",
          public: false,
          signal: ac.signal,
          onProgress: (p) => setState({ status: "running", progress: p }),
        });

        abortRef.current = null;
        setState({ status: "done", result });
      } catch (e: any) {
        abortRef.current = null;

        const isAbort = e?.name === "AbortError" || (e instanceof DOMException && e.name === "AbortError");
        if (isAbort) {
          setState({ status: "error", message: "Shuffle cancelled." });
          return;
        }

        const msg = typeof e?.message === "string" ? e.message : "Shuffle failed.";
        setState({ status: "error", message: msg });
      }
    },
    [running]
  );

  const startLiked = useCallback(() => startWithOptions({ source: { kind: "Liked" } }), [startWithOptions]);

  const startPlaylist = useCallback(
    (p: SimplifiedPlaylist) =>
      startWithOptions({ source: { kind: "playList", playListId: p.id, playListName: p.name } }),
    [startWithOptions]
  );

  const jobSummary = useMemo(() => {
    if (state.status !== "running") return null;
    const p = state.progress;

    switch (p.stage) {
      case "init":
        return "Preparing shuffle…";
      case "fetching_uris": {
        const f = p.fetch;
        const total = typeof f.total === "number" ? ` / ${f.total.toLocaleString()}` : "";
        return `Fetching tracks… ${f.fetched.toLocaleString()}${total}`;
      }
      case "shuffling":
        return `Shuffling ${p.totalUris.toLocaleString()} tracks…`;
      case "creating_playlist":
        return "Creating playlist…";
      case "adding_items":
        return `Adding tracks… ${p.added.toLocaleString()} / ${p.total.toLocaleString()} (batch ${p.batchIndex}/${p.batchesTotal})`;
      case "done":
        return "Done.";
      default:
        return null;
    }
  }, [state]);

import { useCallback, useMemo, useRef, useState } from "react";
import type { SimplifiedPlaylist } from "../api/spotify/types";
import { createRandomizedPlaylist } from "../features/shuffle/createRandomized";
import type { ShuffleJobProgress, ShuffleJobResult } from "../features/shuffle/jobTypes";
import type { shuffleSource as ShuffleSource } from "../features/shuffle/types";

export type ShuffleJobState =
  | { status: "idle" }
  | { status: "running"; progress: ShuffleJobProgress }
  | { status: "done"; result: ShuffleJobResult }
  | { status: "error"; message: string };

function formatDateStamp(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function defaultNameForSource(source: ShuffleSource): string {
  if (source.kind === "Liked") return `Randomized • Liked Songs • ${formatDateStamp()}`;
  return `Randomized • ${source.playListName ?? "Playlist"} • ${formatDateStamp()}`;
}

export function useShuffleJob() {
  const [state, setState] = useState<ShuffleJobState>({ status: "idle" });

  const abortRef = useRef<AbortController | null>(null);
  const running = state.status === "running";

  const cancel = useCallback(() => {
    abortRef.current?.abort(new DOMException("Cancelled", "AbortError"));
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (running) return;
    setState({ status: "idle" });
  }, [running]);

  const startWithOptions = useCallback(
    async (opts: { source: ShuffleSource; name?: string }) => {
      if (running) return;

      const ac = new AbortController();
      abortRef.current = ac;

      const name = opts.name && opts.name.trim() ? opts.name.trim() : defaultNameForSource(opts.source);

      setState({ status: "running", progress: { stage: "init", source: opts.source } });

      try {
        const result = await createRandomizedPlaylist({
          source: opts.source,
          name,
          description: "Created by Spotify Randomizer",
          public: false,
          signal: ac.signal,
          onProgress: (p) => setState({ status: "running", progress: p }),
        });

        abortRef.current = null;
        setState({ status: "done", result });
      } catch (e: any) {
        abortRef.current = null;

        const isAbort = e?.name === "AbortError" || (e instanceof DOMException && e.name === "AbortError");
        if (isAbort) {
          setState({ status: "error", message: "Shuffle cancelled." });
          return;
        }

        const msg = typeof e?.message === "string" ? e.message : "Shuffle failed.";
        setState({ status: "error", message: msg });
      }
    },
    [running]
  );

  const startLiked = useCallback(() => startWithOptions({ source: { kind: "Liked" } }), [startWithOptions]);

  const startPlaylist = useCallback(
    (p: SimplifiedPlaylist) =>
      startWithOptions({ source: { kind: "playList", playListId: p.id, playListName: p.name } }),
    [startWithOptions]
  );

  const jobSummary = useMemo(() => {
    if (state.status !== "running") return null;
    const p = state.progress;

    switch (p.stage) {
      case "init":
        return "Preparing shuffle…";
      case "fetching_uris": {
        const f = p.fetch;
        const total = typeof f.total === "number" ? ` / ${f.total.toLocaleString()}` : "";
        return `Fetching tracks… ${f.fetched.toLocaleString()}${total}`;
      }
      case "shuffling":
        return `Shuffling ${p.totalUris.toLocaleString()} tracks…`;
      case "creating_playlist":
        return "Creating playlist…";
      case "adding_items":
        return `Adding tracks… ${p.added.toLocaleString()} / ${p.total.toLocaleString()} (batch ${p.batchIndex}/${p.batchesTotal})`;
      case "done":
        return "Done.";
      default:
        return null;
    }
  }, [state]);

  const progressRatio = useMemo(() => {
    if (state.status !== "running") return null;
    const p = state.progress;

    if (p.stage === "fetching_uris") {
      const total = p.fetch.total;
      if (!total) return null;
      return Math.min(1, p.fetch.fetched / total);
    }

    if (p.stage === "adding_items") {
      if (!p.total) return null;
      return Math.min(1, p.added / p.total);
    }

    return null;
  }, [state]);

  return {
    state,
    running,
    jobSummary,
    progressRatio,

    startWithOptions,
    startLiked,
    startPlaylist,

    cancel,
    reset,
  };
 }
  const progressRatio = useMemo(() => {
    if (state.status !== "running") return null;
    const p = state.progress;

    if (p.stage === "fetching_uris") {
      const total = p.fetch.total;
      if (!total) return null;
      return Math.min(1, p.fetch.fetched / total);
    }

    if (p.stage === "adding_items") {
      if (!p.total) return null;
      return Math.min(1, p.added / p.total);
    }

    return null;
  }, [state]);

  return {
    state,
    running,
    jobSummary,
    progressRatio,

    startWithOptions,
    startLiked,
    startPlaylist,

    cancel,
    reset,
  };
 }
