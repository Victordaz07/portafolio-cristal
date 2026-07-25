import { SERVICE_ICONS, CameraIcon, type ServiceIconKey } from "@/components/icons";

export interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function ServiceCard({ icon, title, description }: ServiceCardProps) {
  const Icon = SERVICE_ICONS[icon as ServiceIconKey] ?? CameraIcon;

  return (
    <div className="flex flex-col items-center gap-sp-3 rounded-md border border-line bg-white p-sp-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime/25 text-coral">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-bodoni italic font-bold text-ink">{title}</p>
      <p className="text-sm text-ink/70">{description}</p>
    </div>
  );
}
