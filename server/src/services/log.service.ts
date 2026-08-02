import { Log, LogLevel, LogCategory } from '../models/Log';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';

export async function writeLog(data: {
  level: LogLevel;
  category: LogCategory;
  message: string;
  meta?: Record<string, unknown>;
  userId?: string;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await Log.create({
      level: data.level,
      category: data.category,
      message: data.message,
      meta: data.meta || {},
      userId: data.userId || null,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
      timestamp: new Date(),
    });
  } catch {
    // Never throw from log service
  }
}

export async function listLogs(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const filter: Record<string, unknown> = {};
  if (query.level) filter.level = query.level;
  if (query.category) filter.category = query.category;
  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) (filter.timestamp as any).$gte = new Date(query.from as string);
    if (query.to) (filter.timestamp as any).$lte = new Date(query.to as string);
  }

  const [data, total] = await Promise.all([
    Log.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    Log.countDocuments(filter),
  ]);

  return buildPaginatedResult(data, total, { page, limit, skip });
}
