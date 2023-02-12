const dotenv = require('dotenv');
dotenv.config();
const express = require('express')
const app = express()
const multer = require('multer');

const port = process.env.PORT || 5000
// console.log(process.env);
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
// console.log(AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET_NAME);

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
})

// params for s3 bucket creation
const bucketParams = {
    Bucket: AWS_BUCKET_NAME
};

// create s3 bucket arrow function  
const createBucket = () => {
    s3.createBucket(bucketParams, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`Bucket ${AWS_BUCKET_NAME} created successfully`);
        }
    })
}

// call createBucket function
// createBucket();
app.get('/', (req, res) => res.send("AWS S3 is running successfully"))

// upload file route to s3 using  multer
app.post('/upload', (req, res) => {
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024 // no larger than 5mb
        },
    }).single('file');

    upload(req, res, (err) => {
        if (err) {
            console.log(err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(422).send({
                    message: 'File size is too large. Max limit is 5MB'
                });
            }
            return res.status(422).send({
                message: 'File upload failed'
            });
        }
        // upload file to s3
        const file = req.file;
        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: file.originalname,
            Body: file.buffer
        };
        s3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: 'File upload failed'
                });
            } else {
                console.log(data);
                return res.status(200).send({
                    message: 'File uploaded successfully',
                    data
                });
            }
        });
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))