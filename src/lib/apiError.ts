import { PlacesError, type PlacesFailureKind } from "./places";

/**
 * One place where a thrown pipeline error becomes an HTTP answer.
 *
 * Two things matter to the person reading it: whether retrying is worth their
 * time, and — when it isn't — that the problem is this app's configuration and
 * not their connection. `reason` is the machine-readable version of the same
 * fact; /api/health explains it in full.
 */
export interface ApiFailure {
  status: number;
  body: { error: string; reason: string };
}

const PLACES_FAILURES: Record<PlacesFailureKind, { status: number; message: string }> = {
  denied: {
    status: 502,
    message: "Search isn't set up correctly — the restaurant data service rejected this app's key.",
  },
  request: {
    status: 502,
    message: "Search isn't set up correctly — the restaurant data service rejected the request.",
  },
  quota: {
    status: 503,
    message: "Search has hit its limit for now — try again in a few minutes.",
  },
  upstream: {
    status: 502,
    message: "The restaurant data service is having trouble — please try again.",
  },
  timeout: {
    status: 504,
    message: "That took too long — please try again.",
  },
  network: {
    status: 502,
    message: "Couldn't reach the restaurant data service — check your connection and try again.",
  },
};

export function describeApiFailure(error: unknown, fallback: string): ApiFailure {
  if (error instanceof PlacesError) {
    const { status, message } = PLACES_FAILURES[error.kind];
    return { status, body: { error: message, reason: `places_${error.kind}` } };
  }
  return { status: 500, body: { error: fallback, reason: "unknown" } };
}
