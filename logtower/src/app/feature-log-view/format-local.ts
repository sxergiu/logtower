import {formatDate} from "@angular/common";

// Timestamps are SQLite datetime('now'): UTC, but written without a zone,
// which Date would otherwise read as local time
export function formatLocal(dateString: string, format: string, locale: string): string {
  const date = new Date(dateString.replace(' ', 'T') + 'Z');
  return isNaN(date.getTime()) ? dateString : formatDate(date, format, locale);
}
