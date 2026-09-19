"use client";

import React, { useState, useEffect } from "react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoCloudUploadOutline } from "react-icons/io5";
import Image from "next/image";
import CroppingPopUp from "@/components/cropping-pop-up";

const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

interface ImageUploadProps {
  selectedImage: File | null;
  onImageChange: (image: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ selectedImage, onImageChange }) => {
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(
    null
  );
  // The file waiting to be cropped. Works as open state for cropping modal too.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // Kept so re-cropping works off the original instead of cropping a crop,
  // which can't recover edges that were already trimmed away.
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedImage) {
      const preview = URL.createObjectURL(selectedImage);
      setUploadedImagePath(preview);
      return () => URL.revokeObjectURL(preview);
    } else {
      setUploadedImagePath(null);
      setOriginalFile(null);
    }
  }, [selectedImage]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setPendingFile(event.target.files[0]);
    }
    // Let the same file be picked again after it's been removed.
    event.target.value = "";
  };

  const removeSelectedImage = () => {
    setUploadedImagePath(null);
    setOriginalFile(null);
    onImageChange(null);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPendingFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    noClick: true,
  });

  const handleCropped = (cropped: File) => {
    setOriginalFile(pendingFile);
    setPendingFile(null);
    onImageChange(cropped);
  };

  return (
    <div className="space-y-3 h-full">
      <div {...getRootProps()} className="h-full">
        <label
          htmlFor="dropzone-file"
          className="relative flex flex-col items-center justify-center p-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 w-full visually-hidden-focusable h-full"
        >
          {!uploadedImagePath && (
            <div className="text-center">
              <div className="border p-2 rounded-md max-w-min mx-auto">
                <IoCloudUploadOutline size="1.6em" />
              </div>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Upload a banner</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-400">
                Select an image or drag here to upload directly
              </p>
            </div>
          )}

          {uploadedImagePath && (
            <div className="w-full space-y-2 text-center">
              <Image
                width={1000}
                height={1000}
                src={uploadedImagePath}
                className="w-full aspect-[3/1] object-cover rounded-md opacity-70"
                alt="uploaded image"
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Image Uploaded</p>
                <p className="text-xs text-gray-400">
                  Click here to upload another image
                </p>
              </div>
            </div>
          )}
        </label>

        <Input
          {...getInputProps()}
          id="dropzone-file"
          accept="image/png, image/jpeg"
          type="file"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {!!uploadedImagePath && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPendingFile(originalFile ?? selectedImage)}
            type="button"
            variant="secondary"
          >
            Crop
          </Button>
          <Button
            onClick={removeSelectedImage}
            type="button"
            variant="destructive"
          >
            Remove
          </Button>
        </div>
      )}

      <CroppingPopUp
        file={pendingFile}
        onCancel={() => setPendingFile(null)}
        onCropped={handleCropped}
      />
    </div>
  );
};

export default ImageUpload;
