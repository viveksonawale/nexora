import { HackathonService } from "./server/modules/hackathon/hackathon.service";

async function main() {
  try {
    const res = await HackathonService.getHackathons({ sort: "startsAt" });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
main();
