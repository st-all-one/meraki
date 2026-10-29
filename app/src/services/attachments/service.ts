import {
  archiveDemandAttachment,
  attachmentAccess,
  attachmentsForItem,
  attachmentsForMessage,
  linkDemandAttachment,
  linkMessageAttachment,
  readAttachment,
  storeAttachment,
  storeCanvasExport,
} from "./storage.ts";

export default {
  name: "attachments",
  create() {
    return {
      storeAttachment,
      storeCanvasExport,
      linkDemandAttachment,
      linkMessageAttachment,
      attachmentsForItem,
      attachmentsForMessage,
      archiveDemandAttachment,
      attachmentAccess,
      readAttachment,
    };
  },
};
