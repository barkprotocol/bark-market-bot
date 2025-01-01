import { TokenSchema } from "../models/index";

interface TokenProps {
  poolId?: string;
  id?: string;
  filter?: any;
  data?: any;
  [key: string]: any;
}

export const RaydiumTokenService = {
  // Create a new token or return if it exists
  create: async (props: TokenProps) => {
    try {
      const existing = await TokenSchema.findOne({ poolId: props.poolId });
      if (existing == null) {
        return await TokenSchema.create(props);
      } else {
        console.log("Token with poolId already exists:", props.poolId);
        return null; // Token already exists
      }
    } catch (err: any) {
      console.error("Error creating token:", err.message);
      throw new Error("Error creating token: " + err.message);
    }
  },

  // Find a token by its ID
  findById: async (props: TokenProps) => {
    try {
      const { id } = props;
      const result = await TokenSchema.findById(id);
      return result;
    } catch (err: any) {
      console.error("Error finding token by ID:", err.message);
      throw new Error("Error finding token by ID: " + err.message);
    }
  },

  // Find a single token based on filter
  findOne: async (props: TokenProps) => {
    try {
      const result = await TokenSchema.findOne(props).sort({ timeStamp: -1 });
      return result;
    } catch (err: any) {
      console.error("Error finding one token:", err.message);
      throw new Error("Error finding one token: " + err.message);
    }
  },

  // Find the first token based on filter and sorted by creation_ts
  findLastOne: async (props: TokenProps) => {
    try {
      const result = await TokenSchema.findOne(props).sort({ creation_ts: 1 });
      return result;
    } catch (err: any) {
      console.error("Error finding the last token:", err.message);
      throw new Error("Error finding the last token: " + err.message);
    }
  },

  // Find multiple tokens based on filter
  find: async (props: TokenProps) => {
    try {
      const result = await TokenSchema.find(props);
      return result;
    } catch (err: any) {
      console.error("Error finding tokens:", err.message);
      throw new Error("Error finding tokens: " + err.message);
    }
  },

  // Update one token by ID
  updateOne: async (props: TokenProps) => {
    const { id } = props;
    try {
      const result = await TokenSchema.findByIdAndUpdate(id, props, { new: true });
      return result;
    } catch (err: any) {
      console.error("Error updating token:", err.message);
      throw new Error("Error updating token: " + err.message);
    }
  },

  // Find and update a token based on filter and data
  findOneAndUpdate: async (props: TokenProps) => {
    const { filter, data } = props;
    try {
      const result = await TokenSchema.findOneAndUpdate(
        filter,
        { $set: data },
        { new: true }
      );
      return result;
    } catch (err: any) {
      console.error("Error updating token:", err.message);
      throw new Error("Error updating token: " + err.message);
    }
  },

  // Delete one token based on filter
  deleteOne: async (props: TokenProps) => {
    try {
      const result = await TokenSchema.findOneAndDelete(props);
      return result;
    } catch (err: any) {
      console.error("Error deleting token:", err.message);
      throw new Error("Error deleting token: " + err.message);
    }
  }
};
