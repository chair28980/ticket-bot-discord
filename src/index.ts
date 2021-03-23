import { getAccessToken } from "./api";
import { client } from "./models/Discord";
import { stubHubEventData } from "./models/StubHubEventData";

(async function () {
  const events = stubHubEventData.getAllEvents();
  !process.env.BEARER_TOKEN && (await getAccessToken());
  await client.initClient().catch(console.error);
  client.parseMessage("!event");

  setInterval(() => {
    console.log("CHECKING FOR EVENTS !!!");
    events.forEach((e) => client.checkForEvents(e));
  }, 1000 * 10);

  setInterval(() => {
    console.log("CHECKING FOR LISTINGS !!!");
    events.forEach((e) => client.checkForListing(e));
  }, 1000 * 80);
})();
