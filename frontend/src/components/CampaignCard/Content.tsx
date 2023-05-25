import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import { useEffect, useState } from "react";
import "twin.macro";

import { deleteCampaign, setCampaignCoverImage } from "api";
import { FetchError } from "api/api";
import Button from "components/Button";
import Card from "components/Card";
import Dropdown from "components/Dropdown";
import DropdownOption from "components/Dropdown/DropdownOption";
import Dropzone from "components/Dropzone";
import Modal from "components/Modal";
import { pushToast } from "utils";

import CampaignStatus from "./CampaignStatus";

import type { VariantProps } from "@stitches/react";
import type { Campaign } from "pages/admin/types";
import type { Dispatch, MouseEventHandler, SetStateAction } from "react";
import type { CampaignWithRoles } from "types/api";

const dateToString = (date: Date) => moment(date).format("D MMM YYYY");

type AdminProps = {
  campaignId: number;
  isAdmin: true;
};

type NonAdminProps = {
  campaignId?: number;
  isAdmin?: false;
};

type BaseProps = {
  organisationLogo?: string;
  title: string;
  appliedFor: CampaignWithRoles["applied_for"];
  startDate: Date;
  endDate: Date;
  img: string;
  openModal: MouseEventHandler<HTMLButtonElement>;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
};

type Props = BaseProps & (AdminProps | NonAdminProps);

const Content = ({
  campaignId,
  organisationLogo,
  title,
  appliedFor,
  startDate,
  endDate,
  img,
  openModal,
  isAdmin,
  campaigns,
  setCampaigns,
}: Props) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [coverImage, setCoverImage] = useState<File>();
  const [coverImageSrc, setCoverImageSrc] = useState<string>();

  const date = new Date();

  useEffect(() => {
    if (coverImage === undefined) {
      // have to be consistent in returning a function to make eslint happy
      return () => {};
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCoverImageSrc(reader.result as string);
    });
    reader.readAsDataURL(coverImage);

    return () => {
      reader.abort();
    };
  }, [coverImage]);

  const uploadCoverImage = async () => {
    if (!isAdmin) return;

    if (coverImage === undefined) {
      pushToast("Update Campaign Cover Image", "No image given", "error");
      return;
    }

    let newCoverImage;
    try {
      newCoverImage = await setCampaignCoverImage(campaignId, coverImage);
    } catch (err) {
      if (err instanceof FetchError) {
        try {
          const data = (await err.resp.json()) as string;

          pushToast(
            "Update Campaign Cover Image",
            `Internal Error: ${data}`,
            "error"
          );
        } catch {
          pushToast(
            "Update Campaign Cover Image",
            "Internal Error: Response Invalid",
            "error"
          );
        }

        return;
      }

      console.error("Something went wrong");
      pushToast(
        "Update Campaign Cover Image",
        "Something went wrong on the backend!",
        "error"
      );

      return;
    }

    const newCampaigns = [...campaigns];
    newCampaigns[
      newCampaigns.findIndex((campaign) => campaign.id === campaignId)
    ].image = newCoverImage;
    setCampaigns(newCampaigns);

    pushToast(
      "Update Campaign Cover Image",
      "Uploaded image succesfully",
      "success"
    );
  };

  const handleDelete = async () => {
    if (!isAdmin) return;

    try {
      await deleteCampaign(campaignId);
    } catch (e) {
      let message = `Deleting campaign '${title}' failed: `;
      if (e instanceof FetchError) {
        if (e.data !== undefined) {
          message += JSON.stringify(message);
        } else {
          message += "unknown server error";
        }
      } else {
        message += "unknown error";
      }

      pushToast("Delete Campaign", message, "error");

      throw e;
    }
    setCampaigns(campaigns.filter((c: Campaign) => c.id !== campaignId));
    setShowDeleteDialog(false);
  };

  let status: VariantProps<typeof CampaignStatus>["status"];
  if (appliedFor.some(([_, status]) => status === "Success")) {
    status = "offered";
  } else if (appliedFor.some(([_, status]) => status === "Rejected")) {
    status = "rejected";
  } else if (date > endDate) {
    status = "closed";
  } else if (appliedFor.length) {
    status = "pending";
  } else {
    status = "open";
  }

  const dropdown = (
    <Dropdown>
      <DropdownOption
        name="edit"
        icon={<PencilSquareIcon tw="h-5 w-5 inline mr-2" />}
        onClick={() => setShowEditDialog(true)}
      />
      <DropdownOption
        name="delete"
        icon={<TrashIcon tw="h-5 w-5 inline mr-2" />}
        onClick={() => setShowDeleteDialog(true)}
      />
    </Dropdown>
  );

  return (
    <>
      <Card tw="p-0 overflow-hidden text-sm w-96" hoverable>
        <header tw="flex items-center gap-1.5 p-3">
          <img
            tw="w-10 h-10 rounded-sm"
            src={organisationLogo}
            alt="Organisation"
          />
          <div tw="flex flex-col">
            <p>{title}</p>
            <p tw="text-gray-500">
              {dateToString(startDate)} - {dateToString(endDate)}
            </p>
          </div>
          {isAdmin ? (
            dropdown
          ) : (
            <CampaignStatus status={status} onClick={openModal}>
              {status.toUpperCase()}
            </CampaignStatus>
          )}
        </header>
        <div tw="flex items-center justify-center overflow-hidden bg-[#edeeef] aspect-w-16 aspect-h-9">
          <img
            tw="object-contain w-full max-h-full"
            src={img}
            alt="Campaign Cover"
          />
        </div>
      </Card>

      <Modal
        open={showEditDialog}
        closeModal={() => setShowEditDialog(false)}
        title="Edit Campaign"
        description={title}
        closeButton
      >
        <Dropzone onDrop={([file]) => setCoverImage(file)}>
          {coverImage === undefined ? (
            <p>
              Drag and drop your campaign cover image, or click to select an
              image
            </p>
          ) : (
            <img
              tw="max-w-full max-h-full"
              src={coverImageSrc}
              alt="campaign cover"
            />
          )}
        </Dropzone>
        <Button onClick={() => void uploadCoverImage()} tw="ml-auto">
          Update campaign cover image
        </Button>
      </Modal>

      <Modal
        open={showDeleteDialog}
        closeModal={() => setShowDeleteDialog(false)}
        title="Delete Campaign"
        description={title}
      >
        <p>
          Are you sure you want to delete this campaign?{" "}
          <strong>This action is permanent and irreversible.</strong>
        </p>
        <Button color="danger" onClick={() => void handleDelete()}>
          Yes, delete this campaign
        </Button>
      </Modal>
    </>
  );
};

export default Content;
