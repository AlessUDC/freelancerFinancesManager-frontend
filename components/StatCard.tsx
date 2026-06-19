interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  accentColor: string;   // tailwind border color e.g. 'border-l-[#1cc88a]'
  iconColor: string;     // tailwind text color e.g. 'text-[#1cc88a]'
  labelColor?: string;
}

export function StatCard({ label, value, icon, accentColor, iconColor, labelColor }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border-l-[5px] ${accentColor} shadow-[0_0.15rem_1.75rem_rgba(58,59,69,0.1)] p-5 flex items-center justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0.5rem_2rem_rgba(58,59,69,0.15)]`}
    >
      <div>
        <p className={`text-[0.68rem] font-extrabold uppercase tracking-wider mb-1 ${labelColor ?? iconColor}`}>
          {label}
        </p>
        <p className="text-2xl font-bold text-[#3d4066]">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-full bg-[#f0f2fa] flex items-center justify-center text-lg flex-shrink-0">
        <i className={`${icon} ${iconColor}`}></i>
      </div>
    </div>
  );
}
