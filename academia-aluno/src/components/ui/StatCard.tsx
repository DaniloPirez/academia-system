type Props = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
};

export default function StatCard({ label, value, tone = "default" }: Props) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}