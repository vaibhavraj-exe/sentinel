import Users from "../models/users.js";
import Violation from "../models/violations.js";
import Conversations from "../models/conversations.js";
import Messages from "../models/messages.js";
import { getActiveUsers, io } from "../utility/socket.js";
import fs from "fs";
import path from "path";

const penalties = {
  profanity_detection: {
    toxic: 0.01,
    severe_toxic: 0.002,
    obscene: 0.015,
    threat: 0.02,
    insult: 0.01,
    identity_hate: 0.02,
  },
  link_detection: {
    SCAM: 0.05,
    MALWARE: 0.04,
    IP_LOGGER: 0.02,
    NOHTTPS: 0.03,
    EXPLICIT: 0.07,
  },
  image_detection: {
    NSFW: 0.05,
  },
};

const BLOCK_CREDIT = 0.2;

const IGNORED_PIIS = [
  "FIRSTNAME",
  "LASTNAME",
  "MIDDLENAME",
  "URL",
  "DATE",
  "TIME",
];

const newMessageController = async (req, res) => {
  const { recieverID } = req.params;
  const { _id: senderID } = req.user;
  const { message } = req.body;
  const force = req.body?.force || false;

  const user = await Users.findOne({ _id: senderID });

  // const currentDate = new Date();
  // console.log({ user, time: user.createdAt?.getTime(), t: currentDate.getTime() });

  // const difference = currentDate.getTime() - user.createdAt?.getTime();

  // const daysDifference = Math.floor(difference / (1000 * 60 * 60 * 24));

  // console.log({ daysDifference });

  // const profile = [
  //   1 ? user.profilepic?.includes("avatar.iran.liara.run") : 0,
  //   1 ? user.profilepic?.includes("avatar.iran.liara.run") : 0,
  //   0,
  //   0,
  //   0,
  //   1 ? user.location?.latitiude : 0,
  //   1 ? user.verified : 0,
  //   0,
  //   daysDifference,
  // ];
  // console.log({ profile });

  // const result = await fetch("http://localhost:8000/check-account", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ profile, pick: "profile" }),
  // });

  /*
    "default_profile",
    "default_profile_image",
    "favourites_count",
    "followers_count",
    "friends_count",
    "geo_enabled",
    "verified",
    "average_tweets_per_day",
    "account_age_days";
  */


  if (user?.credits <= BLOCK_CREDIT) {
    console.log("You don't have enough credits to send message");
    return res.status(400).send({
      isError: true,
      error:
        "You have been blocked from sending messages for trying to send harmful content, you may appeal to get your credits back",
    });
  }

  console.log({ recieverID, senderID, message, force });
  console.log("req.file--->", req.file);

  if (message) {
    try {
      let conversations = await Conversations.findOne({
        usergroup: { $all: [senderID, recieverID] },
      });

      if (!conversations) {
        conversations = new Conversations({
          usergroup: [senderID, recieverID],
        });
      }

      let fileUrl = null;
      let fileData = null;

      const body = {
        text: message ? message : "",
      };

      if (req.file) {
        fileUrl = req.file.filename;
        console.log({ fileUrl });

        const filePath = req.file.path;
        const fileExtension = filePath.split(".").pop();

        console.log({ fileExtension, body });

        if (fileExtension === "pdf") {
          fileData = fs.readFileSync(filePath).toString("base64");
          body.pdf = fileData;
        } else if (fileExtension === "mp4") {
          fileData = fs.readFileSync(filePath);
          body.video = fileData;
        } else if (
          fileExtension === "jpg" ||
          fileExtension === "jpeg" ||
          fileExtension === "png"
        ) {
          fileData = fs.readFileSync(filePath).toString("base64");
          body.image = fileData;
        }
      }

      console.log({ body });

      console.log("message--->", message, force);
      console.log(message && !force, message, force, "message && !force");
      if (message && !force) {
        const pii = await fetch("http://127.0.0.1:8000/check-pii", {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ text: message }),
        });
        const pii_res = await pii.json();
        console.log({ pii_res: pii_res.ner });
        const filteredEntities = pii_res?.ner.filter(
          (entity) => !IGNORED_PIIS.includes(entity.entity_group)
        );
        console.log({ filteredEntities });
        if (filteredEntities?.length > 0) {
          return res.status(400).send({
            isPii: true,
            piiMessage: filteredEntities,
            messagePayload: {
              message,
            },
          });
        }
      }

      console.log("body--->", body);
      const checkMessage = await fetch(
        "http://127.0.0.1:8000/check-message?return_on_any_harmful=false&return_all_results=true",
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      const checkMessageData = await checkMessage.json();
      console.dir(checkMessageData, { depth: null });
      if (checkMessageData) {
        let safe = { status: true, message: "Message is safe" };
        Object.entries(checkMessageData?.services || []).forEach(
          ([item, value]) => {
            if (value?.harmful) {
              return (safe = {
                status: false,
                message: `Message contains harmful content, please try again with different message [${item}]`,
              });
            }
          }
        );
        if (!safe.status) {
          if (user && checkMessageData.services) {
            const services = checkMessageData.services;
            let totalPenalty = 0;

            for (const service in services) {
              console.log("service--->", service);
              const categories = services[service];
              console.log("categories--->", categories);

              console.log(
                "--------------violation saved-----------------------------------------"
              );
              for (const category of categories.categories) {
                console.log("category--->", category);
                if (penalties[service]?.[category] !== undefined) {
                  console.log(
                    "penalties[service][category]--->",
                    penalties[service][category]
                  );

                  totalPenalty += penalties[service][category];
                }
              }
              const violation = new Violation({
                userID: senderID,
                serviceName: service,
                filters: categories?.categories,
                messagePayload: {
                  message,
                },
                penalty: totalPenalty,
              });
              console.log({ violation });
              await violation.save();
            }

            console.log("totalPenalty--->", totalPenalty);

            totalPenalty = Math.round(totalPenalty * 100) / 100;

            user.credits -= totalPenalty;
            await user.save();
          }

          return res.status(400).send({
            isError: true,
            error:
              safe.message +
              ` [${Math.round(user.credits * 100)} credits remaining]`,
          });
        }
        console.log("checkMessageData--->", checkMessageData);
      }

      const newMessasge = new Messages({
        senderID,
        recieverID,
        messageText: message,
        fileUrl: fileUrl,
      });

      if (newMessasge) {
        conversations.messages.push(newMessasge._id);
      }

      const uploadDir = path.join("uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      await Promise.all([newMessasge.save(), conversations.save()]);

      // Check reciever online status
      const isRecieverActive = getActiveUsers(recieverID);
      console.log("isRecieverActive--->", isRecieverActive);
      // If user online then emi the newMessage event to socketID
      if (isRecieverActive)
        io.to(isRecieverActive).emit("newMessage", newMessasge);

      res.status(201).send({ newMessasge });
    } catch (e) {
      console.log("Error in new message controllers", e);
      res
        .status(400)
        .send({ isError: true, error: "Error in new message controllers" });
    }
  } else {
    res.status(400).send({ isError: true, error: "Invalid message" });
  }
};

export default newMessageController;
