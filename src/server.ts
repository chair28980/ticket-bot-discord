import { config } from "dotenv";
import { getAccessToken } from "./api";

config();

getAccessToken().then((d: any) =>
  console.log(`Access token: ${d.access_token}
Refresh token: ${d.refresh_token}
`)
);