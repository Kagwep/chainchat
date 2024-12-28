import { BrianSDK } from "@brian-ai/sdk";

const options = {
  apiKey: import.meta.env.VITE_BRIAN,
};

export const brian = new BrianSDK(options);


