import { DeleteForeverRounded } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { Divider, IconButton, ListItemIcon, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "twin.macro";

import { deleteCampaign, setCampaignCoverImage } from "api";
import { FetchError } from "api/api";
import { Modal } from "components";
import Button from "components/Button";
import Dropzone from "components/Dropzone";
import { dateToDateString, pushToast } from "utils";

import {
  AdminContentList,
  AdminDivider,
  AdminListItemButton,
  CampaignListItem,
  CampaignListItemImage,
  ContentListHeader,
  DummyDivForAlignment,
  DummyIconForAlignment,
} from "./adminContent.styled";

import type { Campaign } from "../types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  orgId: number;
};

const AdminCampaignContent = ({ campaigns, setCampaigns, orgId }: Props) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [coverImage, setCoverImage] = useState<File>();
  const [coverImageSrc, setCoverImageSrc] = useState<string>();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>({
    id: -1,
    image: "",
    title: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (coverImage === undefined) {
      // have to be consistent in returning a function to make eslint happy
      return () => { };
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

  const handleDelete = async () => {
    try {
      await deleteCampaign(selectedCampaign.id);
    } catch (e) {
      let message = `Deleting campaign '${selectedCampaign.title}' failed: `;
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
    setCampaigns(campaigns.filter((c) => c.id !== selectedCampaign.id));
    setShowDeleteDialog(false);
  };

  const uploadCoverImage = async () => {
    if (coverImage === undefined) {
      pushToast("Update Campaign Cover Image", "No image given", "error");
      return;
    }

    let newCoverImage;
    try {
      newCoverImage = await setCampaignCoverImage(
        selectedCampaign.id,
        coverImage
      );
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
      newCampaigns.findIndex((campaign) => campaign.id === selectedCampaign.id)
    ].image = newCoverImage;
    setCampaigns(newCampaigns);

    pushToast(
      "Update Campaign Cover Image",
      "Uploaded image succesfully",
      "success"
    );
  };

  return (
    <AdminContentList>
      <ContentListHeader>
        <DummyDivForAlignment />
        <ListItemText sx={{ textAlign: "center" }}>Title</ListItemText>
        <ListItemText sx={{ textAlign: "center" }}>Dates</ListItemText>
        <ListItemIcon>
          <DummyIconForAlignment />
        </ListItemIcon>
        <ListItemIcon>
          <Link tw="p-2" to={`/campaign/create/${orgId}`}>
            <AddIcon />
          </Link>
        </ListItemIcon>
      </ContentListHeader>
      <AdminDivider />
      {campaigns.map((c) => (
        <div key={c.id}>
          <CampaignListItem>
            <AdminListItemButton onClick={(_) => navigate(`review/${c.id}`)}>
              <CampaignListItemImage src={c.image} />
              <ListItemText sx={{ textAlign: "center" }}>
                {c.title}
              </ListItemText>
              <ListItemText sx={{ textAlign: "center" }}>
                {dateToDateString(c.startDate)} - {dateToDateString(c.endDate)}
              </ListItemText>
              <ListItemIcon>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCampaign(c);
                    setShowEditDialog(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemIcon>
                <IconButton
                  value={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCampaign(c);
                    setShowDeleteDialog(true);
                  }}
                >
                  <DeleteForeverRounded />
                </IconButton>
              </ListItemIcon>
            </AdminListItemButton>
          </CampaignListItem>
          <Divider />
        </div>
      ))}

      <Modal
        open={showEditDialog}
        closeModal={() => setShowEditDialog(false)}
        title="Edit Campaign"
        description={selectedCampaign.title}
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
        description={selectedCampaign.title}
      >
        <p>
          Are you sure you want to delete this campaign?{" "}
          <strong>This action is permanent and irreversible.</strong>
        </p>
        <Button color="danger" onClick={() => void handleDelete()}>
          Yes, delete this campaign
        </Button>
      </Modal>
    </AdminContentList>
  );
};

export default AdminCampaignContent;
