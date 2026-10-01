"use client";

import { useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";

const ICON_BUTTON =
  "absolute right-2 top-2 z-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 p-1.5 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-white dark:hover:bg-gray-700";

function MapFrame({ embedUrl, address }: { embedUrl: string; address: string }) {
  return (
    <iframe
      src={embedUrl}
      title={`Map of ${address}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      className="absolute inset-0 h-full w-full border-0"
    />
  );
}

function MapUnavailable() {
  return (
    <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 md:h-auto">
      Map unavailable
    </div>
  );
}

type Props = {
  embedUrl: string | null;
  address: string;
};

export function AddressMap({ embedUrl, address }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  if (!embedUrl) return <MapUnavailable />;

  const expand = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const closeOnBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <div className="relative h-64 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 md:h-auto">
      <MapFrame embedUrl={embedUrl} address={address} />
      <button type="button" onClick={expand} aria-label="Expand map" className={ICON_BUTTON}>
        <Maximize2 className="h-4 w-4" />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        aria-label={`Map of ${address}`}
        className="m-auto h-[80vh] w-[90vw] max-w-5xl overflow-hidden rounded-lg bg-white p-0 backdrop:bg-black/60 dark:bg-gray-800"
      >
        <div className="relative h-full w-full">
          {open && <MapFrame embedUrl={embedUrl} address={address} />}
          <button type="button" onClick={close} aria-label="Close map" className={ICON_BUTTON}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </dialog>
    </div>
  );
}
