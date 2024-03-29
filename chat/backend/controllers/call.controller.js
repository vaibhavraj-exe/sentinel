const callController = async (req, res) => {
  try {
    const output = await fetch("http://127.0.0.1:8000/video-detection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await output.json();
    res.status(200).send({ data });
  } catch (e) {
    res
      .status(400)
      .send({ isError: true, error: "Error in violation controllers" });
  }
};

export default callController;
