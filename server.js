const fs = require("fs");
const path = require("path");
const uploadDir = "/root/videos";
const largeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.fileName}-chunk-${req.body.chunkIndex}`);
  },
});

const largeUpload = multer({ largeStorage });

app.post("/largefile", largeUpload.single("file"), async (req, res) => {
  const { fileName, chunkIndex, totalChunks } = req.body;

  const chunkPath = path.join(uploadDir, `${fileName}-chunk-${chunkIndex}`);
  fs.writeFileSync(chunkPath, req.file.buffer);
  console.log(`Saved chunk to: ${chunkPath}`);

  if (parseInt(chunkIndex) + 1 === parseInt(totalChunks)) {
    await mergeChunks(fileName, totalChunks);
  }

  res.sendStatus(200);
});

const mergeChunks = async (fileName, totalChunks) => {
  const finalPath = path.join(uploadDir, fileName);
  const writeStream = fs.createWriteStream(finalPath);

  console.log(`Merging ${totalChunks} chunks for ${fileName}`);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunkPath = path.join(uploadDir, `${fileName}-chunk-${chunkIndex}`);
    const data = fs.readFileSync(chunkPath);
    writeStream.write(data);

    // Remove chunk file after appending
    fs.unlinkSync(chunkPath);
  }

  writeStream.end();
  console.log(`File ${fileName} merged successfully.`);
};