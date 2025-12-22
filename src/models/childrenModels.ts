import mongoose, { Document, Schema } from 'mongoose';

export interface IChildren extends Document {
  firstName: string;
  lastName: string;
  fullName?: string;
  gender: boolean;
  hobbies: string[];
  dob: Date;
  parent: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

const ChildSchema = new Schema<IChildren>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    gender: {
      type: Boolean,
      required: true,
    },
    hobbies: {
      type: [String],
      default: [],
    },
    dob: {
      type: Date,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret): object {
        const {
          firstName,
          lastName,
          gender,
          hobbies,
          dob,
          parent,
          createdAt,
          updatedAt,
        } = ret;
        return {
          firstName,
          lastName,
          gender,
          hobbies,
          dob,
          parent,
          createdAt,
          updatedAt,
        };
      },
    },
    toObject: { virtuals: true },
  },
);

ChildSchema.virtual('fullName').get(function (this: IChildren) {
  return `${this.firstName} ${this.lastName}`;
});

export const ChildModel = mongoose.model<IChildren>('Child', ChildSchema);
