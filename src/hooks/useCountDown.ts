import { useEffect, useState } from "react";
import { APP_CONFIG } from "../utils/config";

// Capture the exact moment the app loaded
const SESSION_START = Date.now();

export const useCountdown = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  let isVotingClosed = false;
  let isResultsEra = false;
  let targetYear = APP_CONFIG.CURRENT_YEAR;
  let displayTime = 0;

  const SIMULATION_SPEED = 5000;
  const timeElapsed = now - SESSION_START;
  const currentYear = new Date().getFullYear();
  if (APP_CONFIG.IS_DEBUG) {
    if (timeElapsed < SIMULATION_SPEED) {
      // PHASE 1: Voting 2026
      targetYear = currentYear;
      isVotingClosed = false;
    } else if (timeElapsed < SIMULATION_SPEED * 2) {
      // PHASE 2: Results 2026
      targetYear = currentYear;
      isVotingClosed = true;
      isResultsEra = true;
    } else {
      // PHASE 3: The "Next Year" Assumption (2027)
      targetYear = currentYear + 1; // The logic flips to the new branch
      isVotingClosed = false;
      isResultsEra = false;
      displayTime = 31536000000; // Fresh countdown
    }
  } else {
    // STANDARD LIVE LOGIC
    const deadline = new Date(APP_CONFIG.VOTING_DEADLINE).getTime();
    isVotingClosed = now >= deadline;
    isResultsEra = isVotingClosed && now <= APP_CONFIG.RESULTS_EXPIRY;
    displayTime = Math.max(0, deadline - now);
  }

  return {
    isVotingClosed,
    isResultsEra,
    activeYear: targetYear,
    ...getReturnValues(displayTime),
  };
};

const getReturnValues = (countDown: number) => {
  const seconds = Math.floor((countDown / 1000) % 60);
  const minutes = Math.floor((countDown / (1000 * 60)) % 60);
  const hours = Math.floor((countDown / (1000 * 60 * 60)) % 24);
  const days = Math.floor((countDown / (1000 * 60 * 60 * 24)) % 30.44);
  const months = Math.floor(countDown / (1000 * 60 * 60 * 24 * 30.44));

  return { months, days, hours, minutes, seconds };
};
