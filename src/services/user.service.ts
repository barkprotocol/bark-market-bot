import { UserSchema } from "../models/index";

export const UserService = {
  create: async (props: any) => {
    try {
      return await UserSchema.create(props);
    } catch (err: any) {
      console.error("Error creating user:", err.message);
      throw new Error(`Error creating user: ${err.message}`);
    }
  },

  findById: async (id: string) => {
    try {
      const result = await UserSchema.findById(id);
      return result;
    } catch (err: any) {
      throw new Error(`Error finding user by ID: ${err.message}`);
    }
  },

  findOne: async (filter: any) => {
    try {
      const result = await UserSchema.findOne({ ...filter, retired: false });
      return result;
    } catch (err: any) {
      throw new Error(`Error finding one user: ${err.message}`);
    }
  },

  findLastOne: async (filter: any) => {
    try {
      const result = await UserSchema.findOne(filter).sort({ updatedAt: -1 });
      return result;
    } catch (err: any) {
      throw new Error(`Error finding the last user: ${err.message}`);
    }
  },

  find: async (filter: any) => {
    try {
      const result = await UserSchema.find(filter);
      return result;
    } catch (err: any) {
      throw new Error(`Error finding users: ${err.message}`);
    }
  },

  findAndSort: async (filter: any) => {
    try {
      const result = await UserSchema.find(filter).sort({ retired: 1, nonce: 1 }).exec();
      return result;
    } catch (err: any) {
      throw new Error(`Error finding and sorting users: ${err.message}`);
    }
  },

  updateOne: async (id: string, props: any) => {
    try {
      const result = await UserSchema.findByIdAndUpdate(id, props);
      return result;
    } catch (err: any) {
      throw new Error(`Error updating user: ${err.message}`);
    }
  },

  findAndUpdateOne: async (filter: any, props: any) => {
    try {
      const result = await UserSchema.findOneAndUpdate(filter, props);
      return result;
    } catch (err: any) {
      throw new Error(`Error updating one user: ${err.message}`);
    }
  },

  updateMany: async (filter: any, props: any) => {
    try {
      const result = await UserSchema.updateMany(filter, { $set: props });
      return result;
    } catch (err: any) {
      throw new Error(`Error updating multiple users: ${err.message}`);
    }
  },

  deleteOne: async (filter: any) => {
    try {
      const result = await UserSchema.findOneAndDelete(filter);
      return result;
    } catch (err: any) {
      throw new Error(`Error deleting user: ${err.message}`);
    }
  },

  extractUniqueCode: (text: string): string | null => {
    const words = text.split(' ');
    return words.length > 1 ? words[1] : null;
  },

  extractPNLdata: (text: string): string | undefined => {
    const words = text.split(' ');
    if (words.length > 1 && words[1].endsWith('png')) {
      return words[1].replace('png', '.png');
    }
  }
};
