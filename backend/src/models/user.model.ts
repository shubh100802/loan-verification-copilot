import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  user_id: string;
  name: string;
  role: 'DATA_OPERATOR' | 'REVIEWER' | 'DATA_CONSUMER';
  email: string;
  password: string;
}

const UserSchema = new Schema<IUser>(
  {
    user_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['DATA_OPERATOR', 'REVIEWER', 'DATA_CONSUMER'] },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
