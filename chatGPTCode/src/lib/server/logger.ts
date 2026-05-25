import 'server-only';

import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

type LogLevel = 'init' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

function getHourlyLogFile(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  return path.join(process.cwd(), 'LOG', `${year}-${month}-${day}-${hour}.log`);
}

export async function logServerEvent(level: LogLevel, event: string, meta: LogMeta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...meta,
  };

  try {
    await mkdir(path.join(process.cwd(), 'LOG'), { recursive: true });
    await appendFile(getHourlyLogFile(), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.error('logger_write_failed', error);
  }
}
