import { Event } from "./types/stubhub";

export const sleep = (timeInMilliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, timeInMilliseconds));

export const getDateTime = () =>
  new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");

export const reduceCategoryName = (event: Event) => {
  const { categories, groupings } = event.ancestors;
  return `${categories.reduce((acc, c) => {
    acc += (acc === "" ? "" : "; ") + c.name;
    return acc;
  }, "")} ${groupings.reduce((acc, g) => {
    acc += `; ${g.name}`;
    return acc;
  }, "")}`
    .trim()
    .slice(0, 100);
};
