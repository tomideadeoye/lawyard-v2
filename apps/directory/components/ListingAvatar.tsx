"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";

interface ListingAvatarProps {
  src?: string;
  name: string;
  type: "lawyer" | "chamber";
}

export function ListingAvatar({ src, name, type }: ListingAvatarProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    if (type === "chamber") {
      return (
        <Building2 className="w-8 h-8 text-muted-foreground/60" strokeWidth={1.5} />
      );
    }
    return (
      <span className="text-2xl font-bold text-muted-foreground">
        {name ? name[0] : ""}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={80}
      height={80}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}
