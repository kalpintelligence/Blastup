import { Contact } from '../models/Contact';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';

export async function listContacts(instanceId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search as string | undefined;

  const filter: Record<string, unknown> = { instanceId };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { pushName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Contact.find(filter)
      .sort({ name: 1, pushName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Contact.countDocuments(filter),
  ]);

  return buildPaginatedResult(data, total, { page, limit, skip });
}

export async function getContactById(instanceId: string, jid: string) {
  return Contact.findOne({ jid, instanceId }).lean();
}
