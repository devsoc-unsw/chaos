"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { cropImageToFile } from "@/lib/crop-image";

const BANNER_ASPECT_RATIO = 3;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export default function CroppingPopUp({
  file,
  onCancel,
  onCropped,
}: {
  file: File | null;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [cropping, setCropping] = useState(false);

  // Start each file from a clean view rather than the last one's pan/zoom.
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setCroppedArea(null);

    if (!file) {
      setImageSrc(null);
      return;
    }

    const preview = URL.createObjectURL(file);
    setImageSrc(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);


  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const applyCrop = async () => {
    if (!file || !croppedArea) {
      return;
    }

    setCropping(true);
    try {
      onCropped(await cropImageToFile(file, croppedArea));
    } catch {
      toast.error("Could not crop the image. Please try another one.");
    } finally {
      setCropping(false);
    }
  };

  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open && !cropping) {
          onCancel();
        }
      }}
    >
      {/* The scale animation clashes with react-easy-crop internal logic to compute
        sizes. Add a custom style to override the default animation. */}
      <DialogContent
        showCloseButton={!cropping}
        className="sm:max-w-2xl data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
      >
        <DialogHeader>
          <DialogTitle>Crop banner</DialogTitle>
          <DialogDescription>
            Drag to reposition and zoom to pick the part of the image used as the
            banner.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[420px] max-h-[50vh] w-full overflow-hidden rounded-lg bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              aspect={BANNER_ASPECT_RATIO}
              objectFit="horizontal-cover"
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="banner-zoom" className="text-sm text-muted-foreground">
            Zoom
          </label>
          <input
            id="banner-zoom"
            type="range"
            className="w-full accent-primary"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={onCancel}
            disabled={cropping}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void applyCrop()}
            disabled={!croppedArea || cropping}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
