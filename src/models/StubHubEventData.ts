import { StubHubEvent } from "./StubHubEvent";

class StubHubEventData {
  events: StubHubEvent[];
  eventListingsMap: Record<number, Set<number>>;

  constructor() {
    this.events = [];
    this.eventListingsMap = {};
  }

  getAllEvents = () => {
    return this.events;
  };

  getEventListingMap = () => {
    return this.eventListingsMap;
  };

  addEvent = (event: StubHubEvent): number => {
    this.events.push(event);
    return this.events.length;
  };

  removeEvent = (index: number): StubHubEvent => {
    const event = this.events[index];
    this.events.splice(index, 1);
    return event;
  };

  addEventListing = (eventId: number, listingId: number) => {
    if (!this.eventListingsMap[eventId]) {
      this.eventListingsMap[eventId] = new Set();
    }
    this.eventListingsMap[eventId].add(listingId);
    return listingId;
  };
}

const stubHubEventData = new StubHubEventData();

export { stubHubEventData };
