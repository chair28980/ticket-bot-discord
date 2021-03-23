import { TextChannel } from "discord.js";
import { config } from "dotenv";
import { Event, Listing } from "../types/stubhub";
import constants from "../constants";

config();

const extractLastName = (words: string) => {
  var names = words.split(" ");
  return names[names.length - 1];
};

export class StubHubEvent {
  discordChannel: TextChannel;
  discordSalesChannel: TextChannel;
  tickets: number;
  listings: number;
  listingsData: Listing[];
  id: number;
  eventDate: Date;
  name: string;
  description: string;
  eventLink: string;
  channelName: string;

  constructor(event: Event) {
    const {
      eventDateUTC,
      name,
      performers,
      description,
      webURI,
      ticketInfo,
      id,
    } = event;
    this.name =
      performers?.length > 1
        ? `${extractLastName(performers[1].name)} at ${extractLastName(
            performers[0].name
          )}`
        : name;
    this.description = description;
    this.eventLink = `${constants.STUBHUB_HOME_URL}/${webURI}`;
    this.channelName = name;
    this.listings = ticketInfo.totalListings;
    this.tickets = ticketInfo.totalTickets;
    this.id = id;
    this.eventDate = new Date(eventDateUTC);
  }

  setChannel = (channel: TextChannel, type: string) => {
    if (type === "sales") {
      this.discordSalesChannel = channel;
    } else {
      this.discordChannel = channel;
    }
  };

  setEventListingsData = (listings: Listing[]) =>
    (this.listingsData = listings);

  setTickets = (tickets: number) => (this.tickets = tickets);
  setListings = (listings: number) => (this.listings = listings);
}
