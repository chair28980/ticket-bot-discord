import { GuildChannel } from "discord.js";

export type ChannelCreate = {
  topic: string;
  channelName: string;
  reason?: string;
  parentChannel?: GuildChannel | string;
  type?: "text" | "voice" | "category" | "news" | "store";
};
