import Image from "next/image";

interface Props {
  size?: number;
  className?: string;
}

export function KiyoAvatar({ size = 32, className = "" }: Props) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-xl ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/app_icon.png"
        alt="Kiyo"
        width={size}
        height={size}
        className="object-cover w-full h-full"
        priority
      />
    </div>
  );
}
