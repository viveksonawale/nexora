import { organizerApi } from "@/api/organizerApi";
import { useAsync } from "./useAsync";

export const useOrganizerEvents = () => useAsync(() => organizerApi.myHackathons(), [], { refetchOnFocus: true });
