import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getLogFileName = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}.log`;
};

export const logger = {
  info: (message: string, meta?: any) => log('INFO', message, meta),
  error: (message: string, meta?: any) => log('ERROR', message, meta),
  warn: (message: string, meta?: any) => log('WARN', message, meta),
};

function log(level: string, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message} ${meta ? JSON.stringify(meta) : ''}\n`;
  const filePath = path.join(LOG_DIR, getLogFileName());

  fs.appendFile(filePath, logEntry, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
}