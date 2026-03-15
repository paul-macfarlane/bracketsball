/** Raw ESPN scoreboard API response types */

export interface ESPNScoreboardResponse {
  leagues?: ESPNLeague[];
  events?: ESPNEvent[];
}

export interface ESPNLeague {
  id: string;
  name: string;
  season?: {
    year: number;
    type: number;
  };
}

export interface ESPNEvent {
  id: string;
  name: string;
  date: string;
  season?: {
    year: number;
    type: number;
  };
  competitions: ESPNCompetition[];
  status: ESPNStatus;
}

export interface ESPNCompetition {
  id: string;
  date: string;
  tournamentId?: number | string;
  venue?: ESPNVenue;
  competitors: ESPNCompetitor[];
  notes?: ESPNNote[];
  status: ESPNStatus;
}

interface ESPNVenue {
  fullName?: string;
  address?: {
    city?: string;
    state?: string;
  };
}

interface ESPNCompetitor {
  id: string;
  team: ESPNTeam;
  score?: string;
  winner?: boolean;
  curatedRank?: {
    current: number;
  };
  order?: number;
}

interface ESPNTeam {
  id: string;
  location: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo?: string;
}

interface ESPNNote {
  type?: string;
  headline?: string;
}

export interface ESPNStatus {
  type: {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    shortDetail?: string;
  };
}
