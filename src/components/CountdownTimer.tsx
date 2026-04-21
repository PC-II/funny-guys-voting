import { useCountdown } from "../hooks/useCountDown";

export const CountdownTimer = () => {
  const { months, days, hours, minutes, seconds } = useCountdown();

  const DateTimeDisplay = ({
    value,
    type,
  }: {
    value: number;
    type: string;
  }) => {
    return (
      <div className="flex flex-col items-center px-3 md:px-6">
        <span className="font-mono text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] md:text-5xl">
          {value < 10 ? `0${value}` : value}
        </span>
        <span className="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
          {type}
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center pb-8">
      <DateTimeDisplay value={months} type="Months" />
      <span className="mb-6 text-2xl font-bold text-slate-700">:</span>
      <DateTimeDisplay value={days} type="Days" />
      <span className="mb-6 text-2xl font-bold text-slate-700">:</span>
      <DateTimeDisplay value={hours} type="Hours" />
      <span className="mb-6 text-2xl font-bold text-slate-700">:</span>
      <DateTimeDisplay value={minutes} type="Mins" />
      <span className="mb-6 text-2xl font-bold text-slate-700">:</span>
      <DateTimeDisplay value={seconds} type="Secs" />
    </div>
  );
};
