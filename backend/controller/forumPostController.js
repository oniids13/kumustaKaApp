// Get pending posts count (for teachers)
const getPendingPostsCount = async (req, res) => {
  try {
    // Check if user is a teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id },
    });

    if (!teacher) {
      return res
        .status(403)
        .json({ error: "Only teachers can access this endpoint" });
    }

    // Count unpublished posts
    const pendingCount = await prisma.forumPost.count({
      where: {
        isPublished: false,
      },
    });

    return res.status(200).json({ pendingCount });
  } catch (error) {
    console.error("Error getting pending posts count:", error);
    return res.status(500).json({ error: "Failed to get pending posts count" });
  }
};
