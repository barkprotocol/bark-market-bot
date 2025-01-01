import { PositionService } from "./position.service";
import { isEqual } from "../utils";
import { QuoteRes } from "./jupiter.service";
import { amount } from "@metaplex-foundation/js";
import { waitFlagForBundleVerify } from "./redis.service";
import { PNL_IMG_GENERATOR_API } from "../config";

export class PNLService {
  wallet_address: string;
  mint: string;
  quote: QuoteRes | undefined | null;

  constructor(
    _wallet_address: string,
    _mint: string,
    _quote?: QuoteRes | undefined | null
  ) {
    this.wallet_address = _wallet_address;
    this.mint = _mint;
    this.quote = _quote;
  }

  // Initialize position if necessary
  async initialize() {
    try {
      const myposition = await PositionService.findLastOne({
        mint: this.mint,
        wallet_address: this.wallet_address,
      });

      if (!this.quote) return;

      if (!myposition) {
        const { inAmount, outAmount } = this.quote;
        const ts = Date.now();

        await PositionService.create({
          mint: this.mint,
          wallet_address: this.wallet_address,
          volume: 0,
          sol_amount: outAmount,
          amount: inAmount,
          received_sol_amount: 0,
          creation_time: ts,
        });
      } else if (myposition.sol_amount <= 0 && myposition.amount <= 0) {
        const waitForBundle = await waitFlagForBundleVerify(this.wallet_address);
        if (waitForBundle) return;

        const { inAmount, outAmount } = this.quote;
        const filter = {
          wallet_address: this.wallet_address,
          mint: this.mint,
        };
        const data = {
          $set: {
            sol_amount: outAmount,
            amount: inAmount,
          },
        };
        await PositionService.findAndUpdateOne(filter, data);
      }
    } catch (error) {
      console.error("Error in initialize:", error);
    }
  }

  // Get PNL info (profit and percentage)
  async getPNLInfo() {
    try {
      const position = await PositionService.findLastOne({
        wallet_address: this.wallet_address,
        mint: this.mint,
      });

      if (!position || !this.quote) return null;

      const { sol_amount, received_sol_amount } = position;
      const { outAmount } = this.quote;

      const profitInSOL = outAmount + received_sol_amount - sol_amount;
      const percent = (profitInSOL * 100) / sol_amount;

      return { profitInSOL, percent };
    } catch (error) {
      console.error("Error in getPNLInfo:", error);
      return null;
    }
  }

  // Generate PNL card image
  async getPNLCard(pnlData: any): Promise<any> {
    try {
      const url = PNL_IMG_GENERATOR_API + "/create";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pnlData),
      });

      if (res.status === 200) {
        const data = await res.json();
        const urls = data.pplUrl.split("/");
        return { pnlCard: urls[urls.length - 1].replace(".png", "png"), pnlUrl: data.pplUrl };
      }
    } catch (error) {
      console.error("Error in getPNLCard:", error);
    }
    return null;
  }

  // Get the amount of SOL spent (bought)
  async getBoughtAmount(): Promise<number | null> {
    try {
      const position = await PositionService.findLastOne({
        wallet_address: this.wallet_address,
        mint: this.mint,
      });

      if (!position) return null;

      return position.sol_amount;
    } catch (error) {
      console.error("Error in getBoughtAmount:", error);
      return null;
    }
  }

  // Handle buy transaction: update position
  async afterBuy(inAmount: number, outAmount: number) {
    try {
      const filter = {
        wallet_address: this.wallet_address,
        mint: this.mint,
      };

      const res = await PositionService.findLastOne(filter);

      if (!res) {
        const ts = Date.now();
        return await PositionService.create({
          wallet_address: this.wallet_address,
          mint: this.mint,
          volume: 0,
          sol_amount: inAmount,
          amount: outAmount,
          received_sol_amount: 0.0,
          creation_time: ts,
        });
      }

      const data = {
        $inc: {
          sol_amount: inAmount,
          amount: outAmount,
        },
      };
      return await PositionService.findAndUpdateOne(filter, data);
    } catch (error) {
      console.error("Error in afterBuy:", error);
    }
  }

  // Handle sell transaction: update position
  async afterSell(outAmount: number, sellPercent: number) {
    try {
      const filter = {
        wallet_address: this.wallet_address,
        mint: this.mint,
      };

      if (isEqual(sellPercent, 100)) {
        const position = await PositionService.findLastOne(filter);
        if (!position) return;

        const { sol_amount, received_sol_amount } = position;
        const profit = outAmount + received_sol_amount - sol_amount;
        const data = {
          $inc: {
            volume: profit,
          },
          $set: {
            sol_amount: 0.0,
            received_sol_amount: 0.0,
            amount: 0.0,
          },
        };
        return await PositionService.findAndUpdateOne(filter, data);
      } else {
        const data = {
          $inc: {
            received_sol_amount: outAmount,
          },
        };
        return await PositionService.findAndUpdateOne(filter, data);
      }
    } catch (error) {
      console.error("Error in afterSell:", error);
    }
  }
}
