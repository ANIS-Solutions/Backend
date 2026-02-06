import { eduModel, IEdu } from './eduModel.js';
import { AddEduInput } from './eduSchema.js';

export const addEduService = async (data: AddEduInput): Promise<IEdu> => {
  const edu = await eduModel.create({
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location,
    schedule: data.schedule.map((it) => ({
      title: it.title,
      day: it.day,
      type: it.type,
      startTime: it.startTime,
      endTime: it.endTime,
    })),
  });
  return edu;
};
