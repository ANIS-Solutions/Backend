import { eduModel } from './edu.model.js';
import { AddEduBodyInput, IEdu } from './edu.schema.js';

export const addEduService = async (data: AddEduBodyInput): Promise<IEdu> => {
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
