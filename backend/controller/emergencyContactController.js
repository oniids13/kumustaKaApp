const { createEmergencyContact } = require("../model/emergencyContactQueries");

const createEmergencyContactController = async (req, res) => {
  try {
    const { name, relationship, phone, isPrimary } = req.body;
    const userId = req.user.id;

    const contact = await createEmergencyContact(userId, {
      name,
      relationship,
      phone,
      isPrimary,
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("Failed creating contact:", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createEmergencyContactController,
};
