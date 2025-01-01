import redisClient, { ITradeGasSetting, ITradeJioFeeSetting, ITradeSlippageSetting } from "./redis";

export enum GasFeeEnum {
  LOW = 'low',
  HIGH = 'high',
  MEDIUM = 'medium',
  CUSTOM = 'custom'
}

// - Turbo 0.0075
// - Safe 0.0045
// - Light 0.0015
export enum JitoFeeEnum {
  LOW = 'Light',
  HIGH = 'Turbo',
  MEDIUM = 'Safe',
  CUSTOM = 'custom'
}

export const UserTradeSettingService = {
  // Retrieve slippage setting for a user
  getSlippage: async (username: string) => {
    const key = `${username}_slippage`;
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data) as ITradeSlippageSetting;
      }
    } catch (error) {
      console.error(`Error getting slippage for ${username}:`, error);
    }
    // Return default values if no data found or an error occurs
    return { slippage: 20, slippagebps: 2000 } as ITradeSlippageSetting;
  },

  // Set slippage setting for a user
  setSlippage: async (username: string, opts: ITradeSlippageSetting) => {
    const key = `${username}_slippage`;
    try {
      await redisClient.set(key, JSON.stringify(opts));
    } catch (error) {
      console.error(`Error setting slippage for ${username}:`, error);
    }
  },

  // Generate inline keyboard for gas fee selection
  getGasInlineKeyboard: async (gasfee: GasFeeEnum) => {
    const keyboards = [
      { text: `${(gasfee === GasFeeEnum.LOW ? "🟢" : "🔴")} Low Gas`, command: 'low_gas' },
      { text: `${(gasfee === GasFeeEnum.MEDIUM ? "🟢" : "🔴")} Medium Gas`, command: 'medium_gas' },
      { text: `${(gasfee === GasFeeEnum.HIGH ? "🟢" : "🔴")} High Gas`, command: 'high_gas' },
    ];
    return keyboards;
  },

  // Get the value for the selected gas fee
  getGasValue: (gasSetting: ITradeGasSetting) => {
    const { gas, value } = gasSetting;
    if (gas === GasFeeEnum.CUSTOM) return value ?? 0.005;

    if (gas === GasFeeEnum.LOW) {
      return 0.005; // SOL
    } else if (gas === GasFeeEnum.MEDIUM) {
      return 0.02; // SOL
    } else if (gas === GasFeeEnum.HIGH) {
      return 0.05; // SOL
    }
    return 0.005; // Default to SOL low fee
  },

  // Set gas fee for a user
  setGas: async (username: string, opts: ITradeGasSetting) => {
    const key = `${username}_gasfee`;
    try {
      await redisClient.set(key, JSON.stringify(opts));
    } catch (error) {
      console.error(`Error setting gas fee for ${username}:`, error);
    }
  },

  // Get the current gas fee for a user
  getGas: async (username: string) => {
    const key = `${username}_gasfee`;
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data) as ITradeGasSetting;
      }
    } catch (error) {
      console.error(`Error getting gas fee for ${username}:`, error);
    }
    // Return default values if no data found or an error occurs
    return { gas: GasFeeEnum.LOW, value: 0.005 } as ITradeGasSetting;
  },

  // Get the next gas fee option
  getNextGasFeeOption: (option: GasFeeEnum) => {
    switch (option) {
      case GasFeeEnum.CUSTOM:
        return GasFeeEnum.LOW;
      case GasFeeEnum.LOW:
        return GasFeeEnum.MEDIUM;
      case GasFeeEnum.MEDIUM:
        return GasFeeEnum.HIGH;
      case GasFeeEnum.HIGH:
        return GasFeeEnum.LOW;
    }
  },

  // Get the value for the selected Jito fee
  getJitoFeeValue: (gasSetting: ITradeJioFeeSetting) => {
    const { jitoOption, value } = gasSetting;

    if (jitoOption === JitoFeeEnum.LOW) {
      return 0.0015; // SOL
    } else if (jitoOption === JitoFeeEnum.MEDIUM) {
      return 0.0045; // SOL
    } else if (jitoOption === JitoFeeEnum.HIGH) {
      return 0.0075; // SOL
    } else {
      return value ?? 0.0045; // Default to medium if custom
    }
  },

  // Set Jito fee for a user
  setJitoFee: async (username: string, opts: ITradeJioFeeSetting) => {
    const key = `${username}_jitofee`;
    try {
      await redisClient.set(key, JSON.stringify(opts));
    } catch (error) {
      console.error(`Error setting Jito fee for ${username}:`, error);
    }
  },

  // Get the current Jito fee for a user
  getJitoFee: async (username: string) => {
    const key = `${username}_jitofee`;
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data) as ITradeJioFeeSetting;
      }
    } catch (error) {
      console.error(`Error getting Jito fee for ${username}:`, error);
    }
    // Return default values if no data found or an error occurs
    return { jitoOption: JitoFeeEnum.MEDIUM, value: 0.0045 } as ITradeJioFeeSetting;
  },

  // Get the next Jito fee option
  getNextJitoFeeOption: (option: JitoFeeEnum) => {
    switch (option) {
      case JitoFeeEnum.CUSTOM:
        return JitoFeeEnum.LOW;
      case JitoFeeEnum.LOW:
        return JitoFeeEnum.MEDIUM;
      case JitoFeeEnum.MEDIUM:
        return JitoFeeEnum.HIGH;
      case JitoFeeEnum.HIGH:
        return JitoFeeEnum.LOW;
    }
  }
}

/** Gas Fee calculation */
/**
 * lamports_per_signature * number_of_signatures
 * 
 * ❯ solana fees
 * Blockhash: 7JgLCFReSYgWNpAB9EMCVv2H4Yv1UV79cp2oQQh2UtvF
 * Lamports per signature: 5000
 * Last valid block height: 141357699
 * 
 * You can get the fee's for a particular message (serialized transaction) by using the getFeeForMessage method.
 * 
 * getFeeForMessage(message: Message, commitment?: Commitment): Promise<RpcResponseAndContext<number>>
 * 
 * constants
 * 
 * pub const DEFAULT_TARGET_LAMPORTS_PER_SIGNATURE: u64 = 10_000;
 * pub const DEFAULT_TARGET_SIGNATURES_PER_SLOT: u64 = 50 * DEFAULT_MS_PER_SLOT; // 20_000
 * 
 * prioritizationFeeLamports = 1000_000
 * fee = 0.001
 * 
 * prioritizationFeeLamports = 25_000_000
 * fee = 0.025
 * 
 * prioritizationFeeLamports = 50_000_000
 * fee = 0.05
 */
