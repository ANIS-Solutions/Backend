import { Types } from 'mongoose';

// REVIEW: we standardize paths with @models
import { IQuest, QuestModel, QuestStatus } from './../models/questModel.js';

// REVIEW: we standardize errors with AppError through errorMiddleware
class QuestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuestError';
  }
}

const isObjectIdEqual = (a: Types.ObjectId, b: Types.ObjectId) =>
  a.toString() === b.toString();

export class QuestService {
  /* ---------- Parent creates quest ---------- */
  static async createQuest(
    parentId: string,
    payload: Partial<IQuest>,
  ): Promise<IQuest> {
    const quest = await QuestModel.create({
      ...payload,
      parent: parentId,
      status: QuestStatus.PENDING,
    });

    return quest;
  }

  /* ---------- Parent gets all quests ---------- */
  static async getParentQuests(parentId: string): Promise<IQuest[]> {
    return QuestModel.find({ parent: parentId })
      .sort({ createdAt: -1 })
      .populate('child', 'firstName lastName');
  }

  /* ---------- Child gets assigned quests ---------- */
  static async getChildQuests(childId: string): Promise<IQuest[]> {
    return QuestModel.find({
      child: childId,
      status: {
        $in: [QuestStatus.PENDING, QuestStatus.IN_PROGRESS],
      },
    }).sort({ schedule: 1 });
  }

  /* ---------- Child starts quest ---------- */
  static async startQuest(questId: string, childId: string): Promise<IQuest> {
    const quest = await QuestModel.findById(questId);

    if (!quest) {
      throw new QuestError('Quest not found');
    }

    if (!isObjectIdEqual(quest.child, new Types.ObjectId(childId))) {
      throw new QuestError('Unauthorized child');
    }

    if (quest.status !== QuestStatus.PENDING) {
      throw new QuestError('Quest cannot be started');
    }

    if (quest.schedule.startAt > new Date()) {
      throw new QuestError('Quest has not started yet');
    }

    quest.status = QuestStatus.IN_PROGRESS;
    await quest.save();

    return quest;
  }

  /* ---------- Child completes quest ---------- */
  static async completeQuest(
    questId: string,
    childId: string,
  ): Promise<IQuest> {
    const quest = await QuestModel.findById(questId);

    if (!quest) {
      throw new QuestError('Quest not found');
    }

    if (!isObjectIdEqual(quest.child, new Types.ObjectId(childId))) {
      throw new QuestError('Unauthorized child');
    }

    if (quest.status !== QuestStatus.IN_PROGRESS) {
      throw new QuestError('Quest is not in progress');
    }

    if (quest.schedule.endAt < new Date()) {
      quest.status = QuestStatus.EXPIRED;
      await quest.save();
      throw new QuestError('Quest expired');
    }

    quest.status = QuestStatus.COMPLETED;
    quest.completedAt = new Date();
    await quest.save();

    return quest;
  }

  /* ---------- Parent validates quest ---------- */
  static async validateQuest(
    questId: string,
    parentId: string,
    isApproved: boolean,
  ): Promise<IQuest> {
    const quest = await QuestModel.findById(questId);

    if (!quest) {
      throw new QuestError('Quest not found');
    }

    if (!isObjectIdEqual(quest.parent, new Types.ObjectId(parentId))) {
      throw new QuestError('Unauthorized parent');
    }

    if (quest.status !== QuestStatus.COMPLETED) {
      throw new QuestError('Quest is not ready for validation');
    }

    if (!isApproved) {
      quest.status = QuestStatus.FAILED;
      await quest.save();
      return quest;
    }

    // Approved
    quest.status = QuestStatus.ARCHIVED;
    await quest.save();

    // TODO: Reward service integration

    return quest;
  }

  /* ---------- Parent cancels quest ---------- */
  static async cancelQuest(questId: string, parentId: string): Promise<IQuest> {
    const quest = await QuestModel.findById(questId);

    if (!quest) {
      throw new QuestError('Quest not found');
    }

    if (!isObjectIdEqual(quest.parent, new Types.ObjectId(parentId))) {
      throw new QuestError('Unauthorized parent');
    }

    if ([QuestStatus.COMPLETED, QuestStatus.ARCHIVED].includes(quest.status)) {
      throw new QuestError('Completed quest cannot be cancelled');
    }

    quest.status = QuestStatus.CANCELLED;
    quest.cancelledAt = new Date();
    await quest.save();

    return quest;
  }
}
