"use client";

import React, { useState, useEffect } from "react";
import { useCallback } from "react";
import Dropzone, { useDropzone } from "react-dropzone";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { FiUpload } from "react-icons/fi";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { IoCloudUploadOutline } from "react-icons/io5";
  import Image from "next/image";
  import Link from "next/link";
  // import {
  //   setSelectedImage,
  //   setUploadedImagePath,
  // } from "@/redux/features/imageUploadSlice";

  import { setCampaignCoverImage } from "@/models/campaign";


  interface ImageUploadProps {
    selectedImage: File | null;
    onImageChange: (image: File | null) => void;
  }

  const ImageUpload: React.FC<ImageUploadProps> = ({ selectedImage, onImageChange }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(
      null
    );

    useEffect(() => {
      if (selectedImage) {
        const preview = URL.createObjectURL(selectedImage);
        setUploadedImagePath(preview);
        return () => URL.revokeObjectURL(preview);
      } else {
        setUploadedImagePath(null);
      }
    }, [selectedImage]);
  
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length) {
        onImageChange(event.target.files[0]);
      }
    };
  
    const removeSelectedImage = () => {
      setLoading(false);
      setUploadedImagePath(null);
      onImageChange(null);
    };
  
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageChange(acceptedFiles[0]);
      }
    }, [onImageChange]);
  
    const { getRootProps, getInputProps } = useDropzone({ onDrop, noClick: true });
  
    return (
      <div className="space-y-3 h-full">
        <div {...getRootProps()} className="h-full">
          <label
            htmlFor="dropzone-file"
            className="relative flex flex-col items-center justify-center p-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 w-full visually-hidden-focusable h-full"
          >

  
            {!loading && !uploadedImagePath && (
              <div className="text-center">
                <div className="border p-2 rounded-md max-w-min mx-auto">
                  <IoCloudUploadOutline size="1.6em" />
                </div>
  
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Drag an image</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400">
                  Select a image or drag here to upload directly
                </p>
              </div>
            )}
  
            {uploadedImagePath && !loading && (
              <div className="text-center space-y-2">
                <Image
                  width={1000}
                  height={1000}
                  src={uploadedImagePath}
                  className="w-full object-contain max-h-16 opacity-70"
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
            disabled={loading || uploadedImagePath !== null}
            onChange={handleImageChange}
          />
        </div>
  
        {!!uploadedImagePath && (
          <div className="flex items-center justify-between">
            <Button
              onClick={removeSelectedImage}
              type="button"
              variant="secondary"
            >
              {uploadedImagePath ? "Remove" : "Close"}
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  export default ImageUpload;