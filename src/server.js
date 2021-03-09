const express = require("express");
const cron = require("node-cron");
const { updateDriveFolderRelatorios } = require("./driveFolder");

const app = express();

app.listen(3000, async () => {
  console.log("listening port 3000");
  updateDriveFolderRelatorios();

  cron.schedule("0 0 * * *", () => {
    console.log("running a task every day");
    updateDriveFolderRelatorios();
  });
});
