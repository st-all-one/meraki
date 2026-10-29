import {
  blake3Hex,
  hashPassword,
  opaqueToken,
  verifyDecoy,
  verifyPassword,
} from "@kernel/crypto/hash.ts";
import {
  can,
  canCreateTask,
  canManageTags,
  canOverridePriority,
  canPromote,
  canSetPo,
} from "./policy.ts";

export default {
  name: "auth",
  create() {
    return {
      can,
      canCreateTask,
      canManageTags,
      canOverridePriority,
      canPromote,
      canSetPo,
      hashPassword,
      verifyPassword,
      verifyDecoy,
      opaqueToken,
      blake3Hex,
    };
  },
};
