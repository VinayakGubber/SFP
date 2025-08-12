# Student Feedback Portal – AWS Hosted Web Application

>AWS Student Feedback Portal – Complete Multi-Tier Cloud Hosting Using (EC2, RDS, S3, VPC)

## Purpose and Intent

This project demonstrates how a web application can be hosted on a cloud platform like AWS by leveraging various AWS services and integrating them into a complete, working solution. It highlights key concepts in **cloud architecture**, **security**, and **application deployment**.

> **Note:** This project was created in a short timeframe to illustrate AWS hosting and integration concepts. Please evaluate it for its architectural demonstration rather than its feature completeness.

---

## Project Overview

The **Student Feedback Portal** is a multi-tier web application hosted entirely on AWS. Its architecture includes:

- **Custom VPC** with public and private subnets for resource segregation
- **RDS MySQL instance** in private subnets with restricted access
- **EC2 Ubuntu instance** running Apache, Node.js backend, and MySQL client
- **S3 bucket** hosting static frontend files and storing exported CSV reports
- **Security groups** controlling inbound/outbound access
- **Internet Gateway** and route tables enabling secure public/private connectivity

---

## Architecture

![Architecture Diagram](https://raw.githubusercontent.com/VinayakGubber/SFP/main/AWS_Architecture_For_SFP.png) 
 > IGNORE the spellings its AI Generated
---

## AWS Setup Instructions

### 1. Create Custom VPC

- **Name:** `SimpleFeedbackVPC`
- **CIDR Block:** `10.0.0.0/16`
- **Tenancy:** Default

### 2. Create Subnets

- **PublicSubnet1:** `10.0.1.0/24` – for EC2
- **PrivateSubnet1:** `10.0.2.0/24` – for RDS
- **PrivateSubnet2:** `10.0.3.0/24` – reserved/optional
- **Availability Zone:** `ap-south-1a`

### 3. Internet Gateway

- **Name:** `SimpleIGW`
- Attach to **SimpleFeedbackVPC**

### 4. Route Tables

- **Public Route Table:** Route `0.0.0.0/0` → SimpleIGW  
  Associate with **PublicSubnet1**
- **Private Route Table:** For **PrivateSubnet1** and **PrivateSubnet2** (no IGW route)

### 5. Security Groups

**SimpleEC2-SG**
- SSH (22) – from **your IP only**
- HTTP (80) – from anywhere (0.0.0.0/0)
- TCP (3000) – from anywhere for Node.js

**SimpleRDS-SG**
- MySQL (3306) – only from **SimpleEC2-SG**

### 6. RDS MySQL Instance

- **Engine:** MySQL
- **Identifier:** `studentfeedback-db`
- **Master credentials:** Your choice
- **Instance size:** `db.t3.micro` (Free Tier)
- **Storage:** 20GB SSD (GP2)
- **Subnet:** PrivateSubnet1 (+ optionally PrivateSubnet2)
- **Public Access:** Disabled
- **Security Group:** SimpleRDS-SG

### 7. EC2 Instance

- **AMI:** Ubuntu 22.04 LTS
- **Type:** `t2.micro` (Free Tier)
- **Network:** SimpleFeedbackVPC → PublicSubnet1
- **Public IP:** Enabled
- **Security Group:** SimpleEC2-SG
- **Key Pair:** Existing or new `.pem` file

---

## EC2 Setup & Backend Configuration

### 1. Install Packages
```bash
sudo apt update
sudo apt install -y nodejs npm mysql-client apache2
sudo systemctl enable apache2
sudo systemctl start apache2
````

### 2. Verify Apache

```bash
cd /var/www/html
ls
```

Visit:
`http://<EC2_PUBLIC_IP>/` → Should display Apache test page.

### 3. Clone Project & Install Dependencies

```bash
git clone https://github.com/your-repo/StudentFeedbackPortal.git
cd StudentFeedbackPortal/server
npm install
npm install aws-sdk
```

### 4. Configure AWS Credentials (`routes/s3Routes.js`)

```javascript
const AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID";
const AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY";
const AWS_REGION = "ap-south-1";
const S3_BUCKET = "cc-s3-bucket-43";
```

### 5. Configure RDS Connection (`server.js`)

```javascript
const pool = mysql.createPool({
  host: "RDS_ENDPOINT",
  user: "RDS_USERNAME",
  password: "RDS_PASSWORD",
  database: "StudentFeedback",
});
```

---

## Database Setup

Connect from EC2 to RDS:

```bash
mysql -h <RDS_ENDPOINT> -u <USERNAME> -p
```

Run:

```sql
CREATE DATABASE IF NOT EXISTS StudentFeedback;
USE StudentFeedback;

DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    email VARCHAR(100) DEFAULT 'user@example.com',
    mobile VARCHAR(15) DEFAULT '0000000000'
);

INSERT INTO users (name, roll_number, password, role, email, mobile) VALUES
('Student One', 'STU001', 'password123', 'student', 'student1@example.com', '9999999999'),
('Student Two', 'STU002', 'password456', 'student', 'student2@example.com', '8888888888');

CREATE TABLE complaints (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    category ENUM('Academics','Facilities','Hostel','Transport','Others') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('Pending','In Progress','Resolved') DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO complaints (name, roll_no, email, mobile, category, message, status) VALUES
('Student One', 'STU001', 'student1@example.com', '9999999999', 'Academics', 'Need access to lecture materials.', 'Pending'),
('Student Two', 'STU002', 'student2@example.com', '8888888888', 'Hostel', 'Leaky faucet in room.', 'In Progress');
```

---

## Frontend Setup (S3 Hosting)

1. Create S3 bucket: **student-feedback-simple**
2. Enable **Static Website Hosting**
3. Update API endpoints in frontend (`script.js`):

```javascript
fetch('http://<EC2_PUBLIC_IP>:3000/login')
```

4. Upload frontend files to the bucket
5. Apply a **bucket policy** for public read access

---

## Starting the Application

On EC2:

```bash
cd StudentFeedbackPortal/server
node server.js
```

---

## Final Verification Checklist

- ✅ EC2 has public IP in public subnet  
- ✅ RDS is in private subnet with no public access  
- ✅ Security groups allow necessary inbound/outbound traffic  
- ✅ Route tables and ACLs configured correctly  
- ✅ Backend server running on EC2  
- ✅ Frontend loads via S3 static hosting


---

## Phase 2: Additional Feature – Feedback Marshal IAM Role & S3 Bucket Policy

The **Feedback Marshal** role demonstrates AWS **role-based access control** with **least privilege** principles.

### Purpose

Enable **read-only access** to feedback CSV files stored in the S3 bucket without allowing modification or deletion.

### IAM User Setup: Individual User "FeedbackMarshal-FM1"

1. **Create IAM User:** `FeedbackMarshal-FM1`
2. **Create and Attach Custom Policy:** `FeedbackMarshalS3ReadOnly`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::student-feedback-simple",
        "arn:aws:s3:::student-feedback-simple/*"
      ]
    }
  ]
}
```

3. **Attach AWS Managed Policy:** `AmazonS3ReadOnlyAccess`
4. **Optional Policy for Bucket Listing:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Sid": "AllowListAllBuckets",
          "Effect": "Allow",
          "Action": "s3:ListAllMyBuckets",
          "Resource": "arn:aws:s3:::*"
      }
  ]
}
```

---

## Update S3 Bucket Policy to Secure Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Statement1",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::student-feedback-simple/*"
    },
    {
      "Sid": "ExplicitDenyWriteDeleteAndBucketDeleteForSpecificUser",
      "Effect": "Deny",
      "Principal": {
        "AWS": "<IAM_USER_ARN>"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject",
        "s3:DeleteObjectVersion",
        "s3:AbortMultipartUpload",
        "s3:RestoreObject",
        "s3:ReplicateObject",
        "s3:ReplicateDelete",
        "s3:ReplicateTags",
        "s3:PutObjectTagging",
        "s3:DeleteObjectTagging",
        "s3:DeleteBucket"
      ],
      "Resource": [
        "arn:aws:s3:::student-feedback-simple",
        "arn:aws:s3:::student-feedback-simple/*"
      ]
    }
  ]
}
```

---

## Verification of Role Behavior

* ✅ Can **list** and **download** CSV files from the bucket
* ❌ Upload/delete operations return **Access Denied**

---

## Expected Output

* Apache server running at `http://<EC2_PUBLIC_IP>/`
* Frontend accessible via the S3 static site URL
* Backend API handling authentication and data operations
* MySQL database storing user data & feedback
* CSV exports uploaded to the S3 bucket automatically
* Fully functional **multi-tier AWS architecture**
* IAM-based role management enforcing least privilege

---

## Technologies Used

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MySQL (AWS RDS)
* **Cloud Services:** AWS EC2, RDS, S3, VPC
* **Web Server:** Apache HTTP Server

---

## Learning Outcomes

* VPC configuration & AWS network security
* Multi-tier application design & deployment on AWS
* Service integration (EC2 ↔ RDS ↔ S3)
* Database schema design & operations
* REST API development
* Static site hosting with S3
* IAM-based security & least privilege principles

---

## Additional Video Resource

[![Video Walkthrough](https://img.youtube.com/vi/1dKDs9hWn88/0.jpg)](https://youtu.be/1dKDs9hWn88)

---

**Disclaimer:** 
>Built for educational purposes to demonstrate AWS hosting concepts — functionality is secondary to architecture.
