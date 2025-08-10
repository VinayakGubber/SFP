// routes/s3Routes.js
const AWS = require("aws-sdk");
const express = require("express");
const router = express.Router();

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------//

// Replace with your actual AWS credentials and bucket
const AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID";
const AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY";
const AWS_REGION = "ap-south-1"; // or your real region, e.g. us-east-1
const S3_BUCKET = "cc-s3-bucket-43";

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------//
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new AWS.S3();

router.get("/generate-upload-url", (req, res) => {
  const fileName = `complaints-${Date.now()}.csv`;
  const params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: "text/csv",
  };

  s3.getSignedUrl("putObject", params, (err, url) => {
    if (err) {
      console.error("S3 pre-sign URL error:", err);
      return res.status(500).json({ error: "Could not generate URL" });
    }
    res.json({ uploadUrl: url, fileName });
  });
});

module.exports = router;
