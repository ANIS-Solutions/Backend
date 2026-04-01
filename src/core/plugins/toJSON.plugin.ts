/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
import { Schema } from 'mongoose';

export const toJSON = (schema: Schema): any => {
  // A. Declare the option type so TypeScript doesn't complain
  // (You might need a .d.ts file for this in strict setups)

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc: any, ret: any, options: any) => {
      delete ret._id;
      delete ret.createdAt;
      delete ret.updatedAt;
      delete ret.__v;

      schema.eachPath((pathName, schemaType) => {
        if ((schemaType as any).options.private) {
          delete ret[pathName];
        }
      });

      return ret;
    },
  });
};
