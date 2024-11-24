export interface SpinnerProps {
  title?: string;
  subtitle?: string;
}

const Spinner = ({ title, subtitle }: SpinnerProps) => {
  return (
    <div className="flex flex-col justify-center gap-4 items-center min-h-[200px]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <div className="ml-3 flex flex-col items-center justify-center text-gray-600 text-sm">
        <div className="font-bold">{title}</div>
        <div>{subtitle}</div>
      </div>
    </div>
  );
};

export default Spinner;
