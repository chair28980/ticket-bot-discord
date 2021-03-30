import axios from "axios";
import dotenv from "dotenv";
import {
  StubHubListingResponse,
  StubHubEventResponse,
  AccessTokenResponse,
  RefreshTokenResponse,
  Listing,
} from "./types/stubhub";
import constants from "./constants";
import eventById from "./data/sampleEvent.json";
import listings from "./data/sampleListing.json";

dotenv.config();
const {
  GET_ACCESS_TOKEN,
  GET_EVENTS,
  GET_LISTINGS,
  GET_REFRESH_TOKEN,
  STUBHUB_API_URL,
} = constants;

const getBase64Encoding = () => {
  const { CONSUMER_SECRET, CONSUMER_KEY } = process.env;
  if (CONSUMER_KEY && CONSUMER_SECRET) {
    return `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
      "base64"
    )}`;
  } else throw new Error("Invalid credentials for Stubhub");
};

export const getListings = async (
  eventId: number
): Promise<Listing[] | null> => {
  try {
    if (process.env.NODE_ENV === "development") return listings.listings;
    if (!process.env.BEARER_TOKEN) throw new Error("Invalid credentials");
    const { data } = await axios.get<StubHubListingResponse>(
      `${STUBHUB_API_URL}${GET_LISTINGS}`,
      {
        params: {
          eventId,
          rows: 1000,
        },
        headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` },
      }
    );

    return data.listings;
  } catch (err) {
    console.log("GET_LISTINGS", err?.response?.data);
    return null;
  }
};

export const getEventById = async (eventId: number) => {
  try {
    if (process.env.NODE_ENV === "development") return eventById;
    if (!process.env.BEARER_TOKEN) throw new Error("Invalid credentials");
    const { data } = await axios.get<StubHubEventResponse>(
      `${STUBHUB_API_URL}${GET_EVENTS}`,
      {
        params: { id: eventId },
        headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` },
      }
    );
    return data.events;
  } catch (err) {
    console.log("GET_EVENT_BY_ID", err?.response?.data);
    return null;
  }
};

export const getAccessToken = async () => {
  try {
    const { STUBHUB_EMAIL, STUBHUB_PASSWORD } = process.env;
    if (STUBHUB_EMAIL && STUBHUB_PASSWORD) {
      const { data } = await axios.post<AccessTokenResponse>(
        `${STUBHUB_API_URL}${GET_ACCESS_TOKEN}`,
        { username: STUBHUB_EMAIL, password: STUBHUB_PASSWORD },
        {
          params: { grant_type: "client_credentials" },
          headers: { Authorization: getBase64Encoding() },
        }
      );

      process.env.BEARER_TOKEN = data.access_token;
      process.env.REFRESH_TOKEN = data.refresh_token;
      return { access_token: data.access_token, refresh_token: data.refresh_token };
    } else throw new Error("Invalid credentials");
  } catch (err) {
    console.log("GET_ACCESS_TOKEN", err);
    return null;
  }
};

export const getRefreshToken = async (refreshToken: string) => {
  try {
    const postData = new URLSearchParams();
    postData.append("grant_type", "refresh_token");
    postData.append("refresh_token", refreshToken);
    const { data } = await axios.post<RefreshTokenResponse>(
      `${STUBHUB_API_URL}${GET_REFRESH_TOKEN}`,
      postData,
      { headers: { Authorization: getBase64Encoding() } }
    );

    process.env.BEARER_TOKEN = data.access_token;
    process.env.REFRESH_TOKEN = data.refresh_token;

    console.log(data);
  } catch (err) {
    console.log("GET_REFRESH_TOKEN", err?.response?.data);
  }
};
