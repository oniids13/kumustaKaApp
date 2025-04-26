const {
  createEmergencyContact,
  getAllEmergencyContact,
  updateEmergencyContact,
} = require("../model/emergencyContactQueries");

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

const getAllEmergencyContactController = async (req, res) => {
  try {
    const userId = req.user.id;
    const allContacts = await getAllEmergencyContact(userId);
    console.log(allContacts);
    res.status(200).json(allContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateEmergencyContactController = async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.contactId;
    const { name, relationship, phone, isPrimary } = req.body;

    const updatedContact = await updateEmergencyContact(userId, contactId, {
      name,
      relationship,
      phone,
      isPrimary,
    });

    res.status(201).json(updatedContact);
  } catch (error) {
    console.error("Failed updating contact:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEmergencyContactController,
  getAllEmergencyContactController,
  updateEmergencyContactController,
};
