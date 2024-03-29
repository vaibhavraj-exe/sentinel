import Violation from "../models/violations.js";

const violationController = async (req, res) => {
  console.log("violationController");
  const { userID } = req.params;

  try {
    const violations = await Violation.find({ userID: userID });
    console.log({ violations });
    res.status(200).send({ violations });
  } catch (e) {
    res
      .status(400)
      .send({ isError: true, error: "Error in violation controllers" });
  }
};

export default violationController;
