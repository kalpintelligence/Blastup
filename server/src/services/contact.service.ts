import { Contact } from '../models/Contact';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';

export async function listContacts(instanceId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search as string | undefined;
  const group = query.group as string | undefined;

  const filter: Record<string, unknown> = { instanceId };
  if (group) {
    filter.groups = group;
  }
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

export async function importContacts(
  instanceId: string,
  contactsList: Array<{ phone: string; name?: string; groups?: string[] }>,
  uploadGroups: string[] = []
) {
  const ops = contactsList.map((item) => {
    const rawPhone = item.phone.replace(/[^0-9]/g, '');
    const jid = `${rawPhone}@s.whatsapp.net`;
    const combinedGroups = Array.from(new Set([...(item.groups || []), ...uploadGroups]));

    return {
      updateOne: {
        filter: { jid, instanceId },
        update: {
          $set: {
            phone: rawPhone,
            name: item.name || null,
            instanceId,
          },
          $addToSet: {
            groups: { $each: combinedGroups },
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length > 0) {
    await Contact.bulkWrite(ops, { ordered: false });
  }

  return { importedCount: ops.length };
}

export async function getGroups(instanceId: string) {
  const result = await Contact.aggregate([
    { $match: { instanceId } },
    { $unwind: '$groups' },
    { $group: { _id: '$groups', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return result.map((r) => ({ name: r._id, count: r.count }));
}

export async function updateContactGroups(
  instanceId: string,
  jids: string[],
  groups: string[],
  action: 'add' | 'remove'
) {
  const updateQuery =
    action === 'add'
      ? { $addToSet: { groups: { $each: groups } } }
      : { $pullAll: { groups: groups } };

  await Contact.updateMany({ instanceId, jid: { $in: jids } }, updateQuery);
  return { success: true };
}

export async function updateContact(
  instanceId: string,
  jid: string,
  data: { name?: string; phone?: string; groups?: string[] }
) {
  const contact = await Contact.findOne({ jid, instanceId });
  if (!contact) throw new Error('Contact not found');

  if (data.name !== undefined) contact.name = data.name || null;
  if (data.groups !== undefined) contact.groups = data.groups;

  if (data.phone && data.phone.trim()) {
    const cleanedPhone = data.phone.replace(/[^0-9]/g, '');
    if (cleanedPhone) {
      contact.phone = cleanedPhone;
      contact.jid = `${cleanedPhone}@s.whatsapp.net`;
    }
  }

  await contact.save();
  return contact.toObject();
}

export async function deleteContact(instanceId: string, jid: string) {
  const result = await Contact.findOneAndDelete({ jid, instanceId });
  if (!result) throw new Error('Contact not found');
  return { success: true };
}

