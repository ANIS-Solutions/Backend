import { CacheService } from '@/core/cache/cache.service';
import { signAccessToken } from '@/core/handlers/jwt.handler';
import AppError from '@/core/utils/AppError';
import { AuthUtils } from '@/core/utils/auth.utils';
import logger from '@/core/utils/logger';
import { QrCode } from '@/core/utils/qrcode.utils';
import {
  HttpStatusCode,
  IChildBase,
  IJwtPayload,
  UserRoles,
  UserScopes,
} from '@anis/shared';
import { JwtPayload } from 'jsonwebtoken';

import { toChildProfile } from './child.dto.js';
import { ChildModel, IChild } from './child.model.js';
import {
  CreateChildBodyInput,
  GetMyChildParamsInput,
  PairChildInput,
  UpdateChildBodyInput,
} from './child.schema.js';

const genAccessToken = (user: IChild): string => {
  return signAccessToken({
    id: user.id,
    role: UserRoles.CHILD,
    deviceId: user.deviceId,
    isActive: user.isActive,
    scopes: [UserScopes.WRITE_TELEMETRY],
  } as Partial<IJwtPayload>);
};
export const addChildService = async (
  reqUser: JwtPayload & IJwtPayload,
  addChildData: CreateChildBodyInput,
): Promise<{
  childData: IChildBase;
  pairingQrCode: string;
  pairToken: string;
}> => {
  const parentId = reqUser.id;

  const { firstName, gender, hobbies, dob } = addChildData;
  const child = await ChildModel.create({
    firstName,
    gender,
    hobbies: hobbies ?? [],
    dob,
    parentId,
  });
  const { token } = AuthUtils.generateCryptoUUID();
  const redisKey = `pairing:token:${token}`;

  await CacheService.setWithTTL(redisKey, child.id, 10 * 60);

  const qrPayload = {
    action: 'PAIR_DEVICE',
    childId: child.id,
    token: token,
  };
  const pairingQrCode = await QrCode.generateBase64(qrPayload);
  return { childData: toChildProfile(child), pairingQrCode, pairToken: token };
};

export const GetMyChildrenService = async (
  reqUser: JwtPayload & IJwtPayload,
): Promise<IChildBase[]> => {
  const parentId = reqUser.id;
  const children = await ChildModel.find({ parentId }).sort({
    createdAt: -1,
  });
  return children.map(toChildProfile);
};

export const getMyChildService = async (
  reqUser: JwtPayload & IJwtPayload,
  reqParams: GetMyChildParamsInput,
): Promise<IChildBase> => {
  const parentId = reqUser.id;
  const childId = reqParams.childId;
  const child = await ChildModel.findOne({
    _id: childId,
    parentId,
  }).lean();

  return toChildProfile(child!);
};

export const updateMyChildService = async (
  parentId: string,
  childId: string,
  updatedChildData: UpdateChildBodyInput,
): Promise<IChildBase> => {
  const updatedChild = await ChildModel.findByIdAndUpdate(
    {
      _id: childId,
      parentId: parentId,
    },
    { $set: updatedChildData },
    {
      new: true,
      runValidators: true,
    },
  ).exec();

  return toChildProfile(updatedChild!);
};

export const pairChildService = async (
  pairChildData: PairChildInput,
): Promise<{ childData: IChildBase; accessToken: string }> => {
  const { childId, token, deviceId, deviceName } = pairChildData;
  const redisKey = `pairing:token:${token}`;
  const id = await CacheService.get(redisKey);
  if (!id) {
    throw new AppError(
      'Qrcode is expired or malformed, please try again.',
      HttpStatusCode.FORBIDDEN,
    );
  }
  await CacheService.delete(redisKey);
  const currChild = await ChildModel.findById(id);
  if (!currChild) {
    // TODO: centralized it later
    throw new AppError(`No child with id ${id}.`, HttpStatusCode.FORBIDDEN);
  }
  currChild.deviceId = deviceId;
  if (deviceName) currChild.deviceName = deviceName;
  await currChild.save();
  const accessToken = genAccessToken(currChild);
  return { childData: toChildProfile(currChild), accessToken };
};
export const getMeService = async (userId: string): Promise<IChildBase> => {
  const currUser = await ChildModel.findById(userId).lean();
  if (!currUser)
    throw new AppError('No current user', HttpStatusCode.NOT_FOUND);
  return toChildProfile(currUser);
};
