const path = require("path");
const fs = require("fs");
const readline = require("readline");
const mime = require("mime-types");
const { google } = require("googleapis");
require("dotenv").config();

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is created automatically
// when the authorization flow completes for the first time.
const LOCAL_TOKEN_PATH = path.join(__dirname, "token.json");
const LOCAL_FILES_TO_UPLOAD_PATH = path.join(__dirname, "filesToUpload");

const DriveFolderService = {
  drive: null,

  async init() {
    const auth = await this.authorize();
    this.drive = google.drive({ version: "v3", auth });
  },

  async authorize() {
    return await new Promise(async (resolve) => {
      const oAuth2Client = new google.auth.OAuth2(
        process.env.DRIVE_CLIENT_ID,
        process.env.DRIVE_CLIENT_SECRET,
        "urn:ietf:wg:oauth:2.0:oob"
      );

      try {
        // Check if we have previously stored a token.
        const tokenFile = await readLocalFile(LOCAL_TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(tokenFile));
        resolve(oAuth2Client);
      } catch (error) {
        this.getAccessToken(oAuth2Client, resolve);
      }
    });
  },

  getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error("Error retrieving access token", err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(LOCAL_TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log("\tToken stored locally");
        });
        callback(oAuth2Client);
      });
    });
  },

  async createFile(fileOptions) {
    if (!this.drive) reject(new Error("Missing param drive"));

    try {
      await this.drive.files.create({
        resource: { name: fileOptions.name, parents: [process.env.DRIVE_FOLDER_ID] },
        media: { mimeType: fileOptions.mimeType, body: fileOptions.value },
        fields: "id",
      });
    } catch (error) {
      console.log("Create file returned an error: " + error);
    }
  },

  async listFiles(queries = "") {
    if (!this.drive) reject(new Error("Missing param drive"));

    try {
      const response = await this.drive.files.list({
        q: queries,
        pageSize: 10,
        fields: "nextPageToken, files(id, name)",
      });
      return response.data.files;
    } catch (error) {
      console.log("List files returned an error: " + error);
    }
  },

  async moveFileToTrash(fileId) {
    if (!this.drive) reject(new Error("Missing param drive"));

    try {
      await this.drive.files.update({ fileId, resource: { trashed: true } });
    } catch (error) {
      console.log("Delete file returned an error: " + error);
    }
  },
};

async function updateDriveFolderRelatorios() {
  console.log("Start DriveFolderService script...");
  await DriveFolderService.init();
  const currentDate = currentDateNormalized();

  console.log("\tReading local files...");
  const filesToUploadOptions = [];
  fs.readdirSync(LOCAL_FILES_TO_UPLOAD_PATH).forEach((fileFullName) => {
    const [fileName, fileExtension] = fileFullName.split(".");
    const mimeType = mime.lookup(fileExtension);

    if (mimeType) {
      filesToUploadOptions.push({
        mimeType,
        name: `${fileName}-${currentDate}.${fileExtension}`,
        value: fs.createReadStream(path.join(LOCAL_FILES_TO_UPLOAD_PATH, fileFullName)),
      });
    }
  });

  console.log("\tMoving old files to trash...");
  const driveFolderOldFiles = await DriveFolderService.listFiles(
    `'${process.env.DRIVE_FOLDER_ID}' in parents`
  );
  for (const file of driveFolderOldFiles) {
    await DriveFolderService.moveFileToTrash(file.id);
  }

  console.log("\tUploading new files...");
  for (const fileOption of filesToUploadOptions) {
    await DriveFolderService.createFile(fileOption);
  }

  console.log("End DriveFolderService script");
}

module.exports = { updateDriveFolderRelatorios };

// helpers
function currentDateNormalized() {
  const date = new Date(),
    dia = date.getDate().toString(),
    diaF = dia.length == 1 ? "0" + dia : dia,
    mes = (date.getMonth() + 1).toString(),
    mesF = mes.length == 1 ? "0" + mes : mes,
    anoF = date.getFullYear(),
    minutoF = date.getMinutes(),
    horaF = date.getHours();

  return horaF + ":" + minutoF + " - " + diaF + "/" + mesF + "/" + anoF;
}

async function readLocalFile(filePath) {
  return await new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, content) => {
      if (err) {
        reject(err);
      }
      resolve(content);
    });
  });
}
