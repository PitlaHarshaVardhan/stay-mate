import { reportsRepository } from './reports.repository';

export const reportsService = {
  create(reportedById: string, input: { reportedUserId?: string; groupId?: string; reason: any; description?: string }) {
    return reportsRepository.create({
      reportedById,
      reportedUserId: input.reportedUserId ?? null,
      groupId: input.groupId ?? null,
      reason: input.reason,
      description: input.description ?? '',
    });
  },
  list() {
    return reportsRepository.findMany();
  },
};
