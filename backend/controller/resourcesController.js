const { getAllResources } = require("../model/resourcesQueries");

const getAllResourcesController = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const allResources = await getAllResources();

    return res.status(200).json({
      success: true,
      data: allResources,
    });
  } catch (error) {
    console.error("Error fetching all resources:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllResourcesController };
