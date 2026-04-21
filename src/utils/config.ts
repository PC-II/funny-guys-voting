type AppState =
  | "LIVE"
  | "DEBUG_RESULTS_ACTIVE"
  | "TRANSITION_TO_RESULTS"
  | "TRANSITION_TO_VOTING"
  | "EMULATE_CYCLE";

const CURRENT_STATE: AppState = "LIVE" as AppState;

const getSystemDates = () => {
  const now = new Date();
  const startTime = now.getTime();
  const currentYear = now.getFullYear();

  // 1. Determine which year we are actually dealing with.
  // If today is before Jan 14th, the "Active Year" for the site is actually LAST year.
  const resultsExpiryDate = new Date(currentYear, 0, 14, 23, 59, 59);
  const isActiveYearLastYear = now < resultsExpiryDate;

  const targetYear = isActiveYearLastYear ? currentYear - 1 : currentYear;

  // 2. Build the deadlines based on that target year
  // Deadline is ALWAYS Dec 31st of the target year
  const votingDeadline = `${targetYear}-12-31T23:59:59`;

  // Results end Jan 14th of the year FOLLOWING the target year
  const resultsExpiry = new Date(targetYear + 1, 0, 14, 23, 59, 59).getTime();

  // 3. Handle Debug Overrides
  switch (CURRENT_STATE) {
    case "EMULATE_CYCLE":
      return {
        targetYear: currentYear, // We will handle year flipping in the hook
        deadline: new Date(startTime + 5000).toISOString(), // First 5 seconds
        expiry: startTime + 10000, // Ends after 10 seconds total
      };
    case "DEBUG_RESULTS_ACTIVE":
      return {
        targetYear: currentYear,
        deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        expiry: new Date(now.getTime() + 24 * 60 * 60 * 1000).getTime(),
      };
    case "TRANSITION_TO_RESULTS":
      return {
        targetYear: currentYear,
        deadline: new Date(now.getTime() + 5000).toISOString(),
        expiry: new Date(now.getTime() + 24 * 60 * 60 * 1000).getTime(),
      };
    case "TRANSITION_TO_VOTING":
      return {
        targetYear: currentYear - 1, // Focus on last year's results
        // 1. Deadline is in the past (Voting is closed)
        deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        // 2. Expiry is in 5 seconds (Results era is about to end)
        expiry: now.getTime() + 5000,
      };
    case "LIVE":
    default:
      return {
        targetYear,
        deadline: votingDeadline,
        expiry: resultsExpiry,
      };
  }
};

const sys = getSystemDates();

export const APP_CONFIG = {
  CURRENT_YEAR: sys.targetYear,
  VOTING_DEADLINE: sys.deadline,
  RESULTS_EXPIRY: sys.expiry,
  IS_DEBUG: (CURRENT_STATE as string) !== "LIVE",
  HALL_OF_FAME_COLLECTION: "hall_of_fame",
};
