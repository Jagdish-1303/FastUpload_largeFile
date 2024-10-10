const fs = require('fs');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const https = require('https');
console.log("started")
const videoDir = './video';

const uploadUrl = 'https://server-url/largefile';

const CHUNK_SIZE = 10 * 1024 * 1024;

// Watch directory for new video files
fs.watch(videoDir, (eventType, filename) => {
    if (eventType === 'rename' && filename) {
        const filePath = path.join(videoDir, filename);
        
        const fileStat = fs.statSync(filePath);
            console.log('Large video file detected:', filename);
            
            // Start uploading in chunks
            uploadFileInChunks(filePath, fileStat.size);
    }
});

// Function to upload the file in chunks
const uploadFileInChunks = async (filePath, fileSize) => {
    console.log(`Starting chunked upload for: ${filePath}`);
    
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        
        const fileStream = fs.createReadStream(filePath, { start, end: end - 1 });

        // Upload the chunk
        try {
            console.log(`Uploading chunk ${chunkIndex + 1} of ${totalChunks}`);
            await uploadChunk(fileStream, chunkIndex, totalChunks, filePath);
        } catch (error) {
            console.error(`Error uploading chunk ${chunkIndex + 1}:`, error);
            break;
        }
    }
};

const uploadChunk = async (fileStream, chunkIndex, totalChunks, filePath) => {
    const formData = new FormData();
    formData.append('file', fileStream);
    formData.append('chunkIndex', chunkIndex);
    formData.append('totalChunks', totalChunks);
    formData.append('fileName', path.basename(filePath));

    const agent = new https.Agent({
        rejectUnauthorized: false, // Disable SSL verification
    });

    try {
        console.log(`Uploading chunk ${chunkIndex + 1} of ${totalChunks}`);
        await axios.post(uploadUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            httpsAgent: agent, // Pass the agent to disable SSL verification
        });

        console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`);
    } catch (error) {
        console.error(`Error uploading chunk ${chunkIndex + 1}:`, error);
        throw error;
    }
};
