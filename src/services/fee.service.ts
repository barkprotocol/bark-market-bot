import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { get_referral_info } from "./referral.service";
import { RESERVE_WALLET } from "../config";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createBurnInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export class FeeService {
  // Calculate and generate fee instructions
  async getFeeInstructions(
    totalFeeInSol: number,
    totalFeeInToken: number,
    username: string,
    pk: string,
    mint: string,
    isToken2022: boolean
  ): Promise<TransactionInstruction[]> {
    try {
      const wallet = Keypair.fromSecretKey(bs58.decode(pk));
      
      // Fetch referral information
      const referralInfo = await this.getReferralInfo(username);
      if (!referralInfo) {
        console.log("No referral information found for:", username);
      }

      // Default referral wallet (RESERVE_WALLET) if no referral address exists
      const referralWallet = referralInfo?.referral_address
        ? new PublicKey(referralInfo.referral_address)
        : RESERVE_WALLET;

      const referralFeePercent = referralInfo?.referral_option ?? 0;
      const referralFee = this.calculateReferralFee(totalFeeInSol, referralFeePercent);
      const stakingFee = totalFeeInSol - referralFee;

      console.log(`Referral Fee: ${referralFee}, Staking Fee: ${stakingFee}`);
      
      const instructions: TransactionInstruction[] = [];

      // Add staking fee transfer if applicable
      if (stakingFee > 0) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: RESERVE_WALLET,
            lamports: stakingFee,
          })
        );
      }

      // Add referral fee transfer if applicable
      if (referralFee > 0) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: referralWallet,
            lamports: referralFee,
          })
        );
      }

      // Burn token fee if applicable
      if (totalFeeInToken > 0) {
        const ata = getAssociatedTokenAddressSync(
          new PublicKey(mint),
          wallet.publicKey,
          true,
          isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
        );
        instructions.push(
          createBurnInstruction(
            ata,
            new PublicKey(mint),
            wallet.publicKey,
            BigInt(totalFeeInToken),
            [],
            isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
          )
        );
      }

      console.log("Generated Fee Instructions:", instructions);
      return instructions;

    } catch (error) {
      console.error("Error in FeeService.getFeeInstructions:", error);
      return [];
    }
  }

  // Helper method to fetch referral info
  private async getReferralInfo(username: string) {
    try {
      const referralInfo = await get_referral_info(username);
      console.log("Referral info fetched:", referralInfo);
      return referralInfo;
    } catch (error) {
      console.error("Error fetching referral info for", username, error);
      return null;
    }
  }

  // Helper method to calculate referral fee
  private calculateReferralFee(totalFeeInSol: number, referralFeePercent: number): number {
    return Math.max(0, Number(((totalFeeInSol * referralFeePercent) / 100).toFixed(0)));
  }
}
