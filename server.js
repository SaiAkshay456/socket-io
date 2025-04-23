const express = require("express");
const multer = require('multer')
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const textract = require("textract");
const util = require("./utils");
const natural = require('natural');
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();


function generateUniqueHexFilename(originalName) {
    const hex = crypto.randomBytes(16).toString("hex"); // Generates 32-character hex
    const ext = path.extname(originalName); // Extracts the file extension
    return `${hex}${ext}`;
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        let uniqueFilName = generateUniqueHexFilename(file.originalname);
        cb(null, uniqueFilName)
    }
})

const upload = multer({ storage: storage })

const app = express();
// const io = new Server(server);
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.resolve("./public")));

// Socket.io
app.set("view engine", "ejs");
// io.on("connection", (socket) => {
//     socket.on("user-message", (message) => {
//         io.emit("message", message);
//     });
// });

app.get("/", (req, res) => {
    res.render("home");
});
//     fieldname: 'file-image',
//   originalname: 'akshay_ats.pdf',
//   encoding: '7bit',
//   mimetype: 'application/pdf',
//   destination: './uploads/',
//   filename: 'd9fdd9d627d9453c417f6e1102c98c64.pdf',
//   path: 'uploads\\d9fdd9d627d9453c417f6e1102c98c64.pdf',
//   size: 507987
// } output looks like this
app.post("/upload", upload.single('file-image'), async (req, res) => {
    let filePath = req.file.path;
    let fileExt = path.extname(req.file.originalname).toLowerCase();
    console.log(req.file)

    let textContent = "";
    let jdVector;
    let resumeVector;

    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);

        textContent = data.text;
        tfidf.addDocument(util.preprocess(util.jdforats).join(' '));
        tfidf.addDocument(util.preprocess(textContent).join(' '));
        // Cosine similarity
        jdVector = tfidf.listTerms(0).map(t => t.tfidf);
        resumeVector = tfidf.listTerms(1).map(t => t.tfidf);
    }
    catch (err) {
        console.log(err)
    }
    let score = util.cosineSimilarity(jdVector, resumeVector);
    const jdKeywords = new Set(util.preprocess(util.jdforats));
    const resumeKeywords = new Set(util.preprocess(textContent));

    const intersection = [...jdKeywords].filter(word => resumeKeywords.has(word));
    const keywordScore = intersection.length / jdKeywords.size;
    const finalScore = (score * 0.7 + keywordScore * 0.3) * 100; // percentage


    res.render("other", { finalScore: finalScore.toFixed(2) })

    console.log(finalScore);
    // const { email, phone, skills, education, experience } = util.extractDetails(textContent);
    // console.log(email);
    // console.log(skills);
    // console.log(experience);
    // console.log(education);
    // console.log(phone);




});

app.listen(9000, () => console.log(`Server Started at PORT:9000`));