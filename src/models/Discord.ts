import {
  Guild,
  ChannelManager,
  Client,
  GuildManager,
  TextChannel,
  Collection,
} from "discord.js";
import { config } from "dotenv";

import { getEventById, getListings } from "../api";
import { StubHubEvent } from "./StubHubEvent";
import { stubHubEventData } from "./StubHubEventData";
import constants from "../constants";
import { Event } from "../types/stubhub";
import { ChannelCreate } from "../types/discord";
import { getDateTime, sleep } from "../helpers";

config();

const {
  removeEvent,
  addEvent,
  getAllEvents,
  getEventListingMap,
  addEventListing,
} = stubHubEventData;
const events = getAllEvents();
const eventListingsMap = getEventListingMap();

const { TWELVE_HOURS, STUBHUB_HOME_URL } = constants;

class DiscordClient extends Client {
  channels: ChannelManager;
  guilds: GuildManager;

  // HELPER METHODS
  async deleteOldEvents(event: StubHubEvent) {
    const eventChannels = this.channels.cache.filter(
      (c) => (c as TextChannel).topic === event.id.toString()
    ) as Collection<string, TextChannel>;

    const salesChannels = this.channels.cache.filter(
      (c) => (c as TextChannel).topic === `${event.id}-sales`
    ) as Collection<string, TextChannel>;

    this.checkStaleChannels(
      eventChannels.array(),
      event,
      "event",
      TWELVE_HOURS
    );
    this.checkStaleChannels(salesChannels.array(), event, "sales");
  }

  async checkStaleChannels(
    channels: TextChannel[],
    stubHubEvent: StubHubEvent,
    type: "sales" | "event",
    timeFrameInMilliseconds: number = 1
  ) {
    const todayTimestamp = new Date().getTime();
    channels.forEach(async (channel) => {
      if (
        stubHubEvent.eventDate.getTime() + timeFrameInMilliseconds >=
        todayTimestamp
      ) {
        stubHubEvent.setChannel(channel, type);
        type === "event" && addEvent(stubHubEvent);
        return;
      }
      await channel.delete();
    });
  }

  async createEventAndSalesChannel(event: Event, stubHubEvent: StubHubEvent) {
    const { name, id } = event;
    const { tickets, listings } = stubHubEvent;
    this.guilds.cache.forEach(async (guild) => {
      const { cache: channels } = guild.channels;
      const categoryListingChannel =
        channels.find(({ name }) => name === "Listings") ||
        (await this.createChannel(guild, {
          type: "category",
          channelName: "Listings",
          topic: "All events listings and ticket details",
        }));

      const categorySalesChannel =
        channels.find((c) => c.name === "Sales") ||
        (await this.createChannel(guild, {
          type: "category",
          channelName: "Sales",
          topic: "All listings' sale details",
        }));

      const eventChannel = (await this.createChannel(guild, {
        channelName: name.slice(0, 100),
        topic: id.toString(),
        parentChannel: categoryListingChannel.id,
      })) as TextChannel;

      stubHubEvent.setChannel(eventChannel, "event");
      addEvent(stubHubEvent);

      await sleep(1000);
      await eventChannel.send(
        `Available tickets: ${tickets} listings: ${listings}`
      );

      const salesChannel = (await this.createChannel(guild, {
        channelName: `${name.slice(0, 94)}-sales`,
        topic: `${id}-sales`,
        parentChannel: categorySalesChannel.id,
      })) as TextChannel;

      stubHubEvent.setChannel(salesChannel, "sales");
    });
  }

  async processEventMessage(
    eventId: number,
    shouldCreateChannel: boolean = false
  ) {
    try {
      const events = await getEventById(eventId);
      if (!events) throw new Error("Event not found");
      const [currentEvent] = events;
      const stubHubEvent = new StubHubEvent(currentEvent);
      shouldCreateChannel
        ? await this.createEventAndSalesChannel(currentEvent, stubHubEvent)
        : await this.deleteOldEvents(stubHubEvent);
      return true;
    } catch (err) {
      console.log("PROCESS EVENT MESSAGE", err);
      return false;
    }
  }

  // MAIN METHODS
  async initClient() {
    console.log("DISCORD BOT LOGIN");
    const { DISCORD_BOT_TOKEN } = process.env;
    if (!DISCORD_BOT_TOKEN) throw new Error("Invalid credentials for Discord");
    await this.login(DISCORD_BOT_TOKEN);
    this.on("ready", () => {
      console.log(`Logged in as ${this.user?.tag}`);
    });
  }

  async createChannel(guild: Guild, channelCreateParams: ChannelCreate) {
    const {
      channelName,
      reason,
      topic,
      parentChannel,
      type = "text",
    } = channelCreateParams;
    const channel = await guild.channels.create(channelName, {
      topic,
      parent: parentChannel,
      reason,
      type,
    });

    return channel;
  }

  parseMessage(command: string) {
    this.on("message", async (message) => {
      const { author, channel, content } = message;
      if (
        !author.username.toUpperCase().includes("TICKET") &&
        channel.type !== "dm" &&
        content.trim().startsWith(command)
      ) {
        const [, eventId] = content.replace(/ +(?= )/g, "").split(" ");
        const isEventProcessed = await this.processEventMessage(
          parseInt(eventId, 10),
          true
        );
        if (!isEventProcessed)
          await channel.send(
            "There has been an error processing the event. Please try again"
          );
        else
          await channel.send(
            `Event's channels have been created successfully.`
          );
      }
    });
  }

  async checkForEvents(event: StubHubEvent) {
    try {
      const events = await getEventById(event.id);
      if (!events) throw new Error("Event not found");
      const { totalTickets, totalListings } = events[0].ticketInfo;
      if (totalListings !== event.listings) {
        await event.discordSalesChannel.send(
          "Total number of listings available " + totalListings
        );
        await event.discordSalesChannel.send(
          "Total number of tickets available " + totalTickets
        );
      }
    } catch (err) {
      console.log("CHECK FOR EVENT: ", err?.response?.data);
    }
  }

  async checkForListing(event: StubHubEvent) {
    try {
      if (event.eventDate.getTime() + TWELVE_HOURS < new Date().getTime()) {
        await event.discordChannel.delete();
        await event.discordSalesChannel.delete();
        const eventIndex = events.indexOf(event);
        eventIndex > -1 && removeEvent(eventIndex);
        return;
      }

      const listings = await getListings(event.id);
      if (!listings) throw new Error("Listings not found");
      if (event.listingsData) {
        await listings.forEach(async (listing) => {
          if (!eventListingsMap[event.id])
            eventListingsMap[event.id] = new Set();

          const { listingId } = listing;
          const eventListingIds = event.listingsData.map((l) => l.listingId);
          const isListingIdNotPresent = !eventListingIds.includes(listingId);
          const hasNoEventListing = !eventListingsMap[event.id].has(listingId);

          if (isListingIdNotPresent && hasNoEventListing) {
            const row = listing.row || listing.products?.[0].row!;
            const seats = listing.products?.reduce((acc, p) => {
              acc += p.seat || "";
              return acc;
            }, "");
            await event.discordChannel.send(`
                ${getDateTime()}: **New listing:**
                 sectionName = ${listing.sectionName}
                 row = ${row}
                 quantity = ${listing.quantity}
                 seats = ${seats}
                 price = *** ${listing.pricePerProduct.amount} ${
              listing.pricePerProduct.currency
            } ***
              `);
            await event.discordChannel.send(
              `${event.eventLink}?byo=true&byo_qty=${listing.quantity}&ticket_id=${listing.listingId}`
            );
            await event.discordChannel.send(
              `${STUBHUB_HOME_URL}/checkout/review?currency=USD&event_id=${event.id}&ticket_id=${listing.listingId}&quantity_selected=${listing.quantity}&gxo=1`
            );
          }
          addEventListing(event.id, listingId);
        });

        await event.listingsData.forEach(async (listing) => {
          const { listingId } = listing;
          const listingIds = listings.map((l) => l.listingId);
          const isListingIdNotPresent = !listingIds.includes(listingId);

          if (isListingIdNotPresent) {
            const row = listing.row || listing.products?.[0].row!;
            const seats = listing.products?.reduce((acc, p) => {
              acc += p.seat || "";
              return acc;
            }, "");
            await event.discordSalesChannel.send(`
                ${getDateTime()}: ***Listing no longer available (sold or revoked)**:
                 sectionName = ${listing.sectionName}
                 row = ${row}
                 quantity = ${listing.quantity}
                 seats = ${seats}
                 price = *** ${listing.pricePerProduct.amount} ${
              listing.pricePerProduct.currency
            } ***
              `);
          }
        });
      }
      event.setEventListingsData(listings);
    } catch (err) {
      console.log("CHECK FOR LISTING: ", err?.response?.data);
    }
  }
}

const client = new DiscordClient();

export { client };
