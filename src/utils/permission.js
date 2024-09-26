async function isGroupAdmin(sock, groupId, userId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const admins = groupMetadata.participants
      .filter((p) => p.admin !== null)
      .map((p) => p.id);
    return admins.includes(userId);
  } catch (error) {
    console.error("Error checking group admin status:", error);
    return false;
  }
}

module.exports = { isGroupAdmin };
