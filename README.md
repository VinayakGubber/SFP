
# Student Feedback Portal - AWS Hosted Web Application

## Purpose and Intent

This project is designed to demonstrate how web applications can be hosted on cloud service providers like AWS by leveraging various AWS resources and integrating them into a complete working solution. It showcases key learnings in cloud architecture, security, and app deployment on AWS.

**Note**: This project was built within a short timeframe to illustrate cloud hosting and integration concepts. It is not intended to be judged solely on feature completeness.

## Project Overview

The Student Feedback Portal is a simple web app hosted on AWS composed of:

- A custom VPC with public and private subnets for resource segregation
- An RDS MySQL instance for the database, hosted on private subnets with restricted access
- An EC2 Ubuntu instance running Apache, Node.js backend, and MySQL client
- An S3 bucket for hosting frontend static files and storing exported CSV files
- Security groups controlling access to EC2 and RDS instances
- Internet Gateway and route tables properly configured for secure public and private communication

## AWS Architecture Setup Procedure

### 1. Create a Custom VPC

- VPC Name: SimpleFeedbackVPC
- CIDR Block: 10.0.0.0/16
- Tenancy: Default

### 2. Create Subnets

- PublicSubnet1: 10.0.1.0/24 (for EC2)
- PrivateSubnet1: 10.0.2.0/24 (for RDS)
- PrivateSubnet2: 10.0.3.0/24 (reserved/optional)
- All within availability zone ap-south-1a

### 3. Create and Attach Internet Gateway

- Name: SimpleIGW
- Attach to SimpleFeedbackVPC

### 4. Create and Associate Route Tables

- Public Route Table with 0.0.0.0/0 → SimpleIGW
- Associate with PublicSubnet1
- Private Route Table for PrivateSubnet1 and PrivateSubnet2 (no IGW route)

### 5. Create Security Groups

- SimpleEC2-SG with inbound rules for:
  - SSH (port 22) from Your IP only
  - HTTP (port 80) from anywhere (0.0.0.0/0)
  - Custom TCP (e.g., 3000) from anywhere if needed for Node.js app
- SimpleRDS-SG allowing MySQL (port 3306) access only from SimpleEC2-SG

### 6. Create RDS MySQL Instance

- Engine: MySQL
- DB Instance Identifier: studentfeedback-db
- Master username/password: your choice
- Instance size: db.t3.micro (Free Tier eligible)
- Storage: 20GB SSD (General Purpose)
- Use PrivateSubnet1 (and optionally PrivateSubnet2)
- Disable public access
- Attach security group SimpleRDS-SG

### 7. Launch EC2 Instance

- Ubuntu 22.04 LTS
- Instance type: t2.micro (Free Tier eligible)
- Network: SimpleFeedbackVPC, Subnet: PublicSubnet1
- Auto-assign Public IP: Enabled
- Attach Security Group SimpleEC2-SG
- Use existing or create a new SSH key pair (.pem)

## EC2 Setup & Backend Configuration

1. SSH into the EC2 instance.
2. Update and install necessary software:

```bash
sudo apt update
sudo apt install -y nodejs npm mysql-client apache2
sudo systemctl enable apache2
sudo systemctl start apache2
```

3. Verify Apache is running:

```bash
cd /var/www/html
ls
```

Visit `http://<EC2-public-IP>/` to see the default Apache "It Works!" page.

4. Clone project and install dependencies:

```bash
git clone https://github.com/your-repo/StudentFeedbackPortal.git
cd StudentFeedbackPortal/server
npm install
```

5. Install AWS SDK for CSV upload:

```bash
npm install aws-sdk
```

6. Update `routes/s3Routes.js`:

```js
const AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID";
const AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY";
const AWS_REGION = "ap-south-1";
const S3_BUCKET = "cc-s3-bucket-43";
```

Replace with actual credentials from AWS Console.

7. Update RDS connection pool in `server.js`:

```js
const pool = mysql.createPool({
  host: "<your-rds-endpoint>",
  user: "<your-db-username>",
  password: "<your-db-password>",
  database: "StudentFeedback",
});
```

## Create Initial Dummy Data in RDS

Connect to your RDS instance:

```bash
mysql -h <RDS-endpoint> -u <Username> -p
```

Run the SQL (omitted here for brevity).

## Start Backend Server

```bash
cd StudentFeedbackPortal/server
node server.js
```

## Host Frontend in S3

- Create S3 bucket: `student-feedback-simple`
- Enable static website hosting
- Update API URLs in frontend JS
- Upload HTML, CSS, JS files to S3
- Make S3 content publicly accessible

## Final Verification

- Open the S3 website URL → Login page should appear
- Test login, feedback, CSV export to S3
- Backend API handles authentication and DB ops
- CSV files are uploaded to S3 bucket

## Key Checks

- EC2 instance must be in public subnet with public IP and SG allowing port 80
- RDS must be private with SG allowing 3306 from EC2
- Route tables and gateways correctly configured

## Output

- Apache: http://<EC2-public-IP>/
- Frontend: S3 static website
- Backend: Node.js API on EC2
- RDS: MySQL on private subnet
- CSV files: Exported to S3

This is a secure, multi-tier cloud-hosted project designed for demonstration.
