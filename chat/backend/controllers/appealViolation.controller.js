import fetch from "node-fetch";
import Violation from "../models/violations.js";
import User from "../models/users.js";
import mongoose from "mongoose";

const { GEMINI_KEY } = process.env;

const appealController = async (req, res) => {
  const { violationID } = req.params;
  const { appealMessage, userId } = req.body;

  console.log({ userId });

  if (!violationID || !appealMessage) {
    return res(400).status({ isError: true, message: "No proper fields" });
  }

  const user = await User.findOne({ _id: userId });
  console.log({ user });

  const violations = await Violation.find({
    userID: userId,
    status: { $ne: "APPEALED" },
  });

  const violation = violations.find(
    (violation) => violation._id.toString() == violationID
  );

  console.log({ violation });

  let text = `
  Forget the previous violations of the user and start from scratch

  This is a violation appeal request for the following violation:
  Violation ID: ${violation._id}
  User ID: ${violation.userID}
  Service Name: ${violation.serviceName}
  Filters: ${violation.filters.join(", ")}
  Message: ${violation.messagePayload.message}
  Created At: ${violation.createdAt}
`;

  if (violations.length > 0) {
    text += `
    For your reference, here are the past violations for this user (be more lenient towards people with a low number of violations):
    ${violations
      .map(
        (v) => `
      - Violation ID: ${v._id}
        Service Name: ${v.serviceName}
        Filters: ${v.filters.join(", ")}
        Created At: ${v.createdAt}`
      )
      .join("\n")}
  `;
  } else {
    text += "\nNo past violations found.";
  }

  text += `
  The response should be in the following format:
  {
    "unban": true or false, (boolean value to indicate if the user can be unbanned or not)
    "message": "User can be unbanned" or "User should remain banned" (message to indicate the decision)
    "reason": "The reason for the decision" (required)
  }
  Please consider being more lenient on users with fewer violations no matter what.
`;

  text += `  Please review the violation and let us know if the user can be unbanned.
The user has requested an appeal for the violation and we need to review the violation to make a decision.
The user has also sent an appeal message with the appeal request:

"${appealMessage}"`;

  console.log({ text });

  try {
    const postData = {
      contents: [
        {
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
        stopSequences: [],
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    };

    let geminiResponse;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );
    } catch (error) {
      return res.status(500).send({
        isError: true,
        message:
          "Your appeal has been sent to the moderation team for further review.",
      });
    }

    const geminiData = await geminiResponse.json();

    console.dir(geminiData, { depth: null });

    const geminiContent = geminiData?.candidates[0]?.content?.parts[0]?.text;

    const isWorthUnbanning = JSON.parse(geminiContent);

    violation.status = isWorthUnbanning.unban ? "APPEALED" : "APPEAL_REJECTED";
    violation.appealMessage = appealMessage;
    violation.appealResponse = isWorthUnbanning;

    await violation.save();

    if (isWorthUnbanning.unban) {
      user.credit += violation.penalty;
      console.log("User credit updated");

      await user.save();
    }

    res.status(200).send(isWorthUnbanning);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .send({ isError: true, message: "Error occurred in appeal controller" });
  }
};

export default appealController;
