const quotesController = async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching quotes: ", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { quotesController };
