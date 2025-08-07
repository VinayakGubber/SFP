# Student Feedback Portal - AWS Hosted Web Application

## Purpose and Intent

This project demonstrates how web applications can be hosted on cloud service providers like AWS by leveraging various AWS resources and integrating them into a complete working solution. It showcases key learnings in cloud architecture, security, and application deployment on AWS.

**Note:** This project was built within a short timeframe specifically to illustrate cloud hosting and integration concepts. Please evaluate it based on its architectural demonstration rather than feature completeness.

## Project Overview

The Student Feedback Portal is a multi-tier web application hosted on AWS, consisting of:

- **Custom VPC** with public and private subnets for resource segregation
- **RDS MySQL instance** hosted on private subnets with restricted access
- **EC2 Ubuntu instance** running Apache, Node.js backend, and MySQL client
- **S3 bucket** for hosting frontend static files and storing exported CSV files
- **Security groups** controlling access to EC2 and RDS instances
- **Internet Gateway and route tables** configured for secure public and private communication

## Architecture

```
Internet → Internet Gateway → Public Subnet (EC2) → Private Subnet (RDS)
                ↓
            S3 Bucket (Static Frontend + CSV Storage)
```

## AWS Setup Instructions

### 1. Create Custom VPC

- **VPC Name:** SimpleFeedbackVPC
- **CIDR Block:** 10.0.0.0/16
- **Tenancy:** Default

### 2. Create Subnets

- **PublicSubnet1:** 10.0.1.0/24 (for EC2)
- **PrivateSubnet1:** 10.0.2.0/24 (for RDS)
- **PrivateSubnet2:** 10.0.3.0/24 (reserved/optional)
- **Availability Zone:** ap-south-1a

### 3. Create and Attach Internet Gateway

- **Name:** SimpleIGW
- **Attach to:** SimpleFeedbackVPC

### 4. Configure Route Tables

- **Public Route Table:** 0.0.0.0/0 → SimpleIGW
  - Associate with PublicSubnet1
- **Private Route Table:** For PrivateSubnet1 and PrivateSubnet2 (no IGW route)

### 5. Create Security Groups

**SimpleEC2-SG** with inbound rules:
- SSH (port 22) from Your IP only
- HTTP (port 80) from anywhere (0.0.0.0/0)
- Custom TCP (port 3000) from anywhere for Node.js app

**SimpleRDS-SG** allowing:
- MySQL (port 3306) access only from SimpleEC2-SG

### 6. Create RDS MySQL Instance

- **Engine:** MySQL
- **DB Instance Identifier:** studentfeedback-db
- **Master username/password:** your choice
- **Instance size:** db.t3.micro (Free Tier eligible)
- **Storage:** 20GB SSD (General Purpose)
- **Subnet:** PrivateSubnet1 (and optionally PrivateSubnet2)
- **Public access:** Disabled
- **Security group:** SimpleRDS-SG

### 7. Launch EC2 Instance

- **AMI:** Ubuntu 22.04 LTS
- **Instance type:** t2.micro (Free Tier eligible)
- **Network:** SimpleFeedbackVPC, Subnet: PublicSubnet1
- **Auto-assign Public IP:** Enabled
- **Security Group:** SimpleEC2-SG
- **Key Pair:** Use existing or create new SSH key pair (.pem)

## EC2 Setup & Backend Configuration

### 1. Initial Setup

SSH into your EC2 instance and update the system:

```bash
sudo apt update
sudo apt install -y nodejs npm mysql-client apache2
sudo systemctl enable apache2
sudo systemctl start apache2
```

### 2. Verify Apache Installation

```bash
cd /var/www/html
ls
```

Visit `http://<EC2-public-IP>/` to confirm Apache is running.

### 3. Clone and Setup Project

```bash
git clone https://github.com/your-repo/StudentFeedbackPortal.git
cd StudentFeedbackPortal/server
npm install
npm install aws-sdk
```

### 4. Configure AWS Credentials

Edit `routes/s3Routes.js`:

```javascript
const AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID";
const AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY";
const AWS_REGION = "ap-south-1";
const S3_BUCKET = "cc-s3-bucket-43";
```

### 5. Configure RDS Connection

Update your backend server configuration (e.g., in `server.js`):

```javascript
const pool = mysql.createPool({
  host: "<your-rds-endpoint>",        // e.g., studentfeedback-db.xxxxxxxx.ap-south-1.rds.amazonaws.com
  user: "<your-db-username>",         // e.g., admin
  password: "<your-db-password>",     // your DB password
  database: "StudentFeedback",
});
```

## Database Setup

Connect to your RDS instance from EC2:

```bash
mysql -h <RDS-endpoint> -u <Username> -p
```

Execute the following SQL to create the database schema and sample data:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS StudentFeedback;
USE StudentFeedback;

-- Drop existing tables (clean setup)
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    email VARCHAR(100) DEFAULT 'user@example.com',
    mobile VARCHAR(15) DEFAULT '0000000000'
);

-- Insert sample users
INSERT INTO users (name, roll_number, password, role, email, mobile)
VALUES
    ('Student One', 'STU001', 'password123', 'student', 'student1@example.com', '9999999999'),
    ('Student Two', 'STU002', 'password456', 'student', 'student2@example.com', '8888888888');

-- Create complaints table
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

-- Insert sample complaints
INSERT INTO complaints (name, roll_no, email, mobile, category, message, status)
VALUES
    ('Student One', 'STU001', 'student1@example.com', '9999999999', 'Academics', 'Need access to lecture materials.', 'Pending'),
    ('Student Two', 'STU002', 'student2@example.com', '8888888888', 'Hostel', 'Leaky faucet in room.', 'In Progress');
```

## Frontend Setup (S3 Hosting)

1. **Create S3 bucket** named `student-feedback-simple`
2. **Enable static website hosting** on the bucket
3. **Update API endpoints** in your frontend files (e.g., `script.js`):
   ```javascript
   fetch('http://<EC2-Public-IP>:3000/login')
   ```
4. **Upload frontend files** to the S3 bucket
5. **Set bucket policy** to make content publicly accessible

## Starting the Application

Start the backend Node.js server on EC2:

```bash
cd StudentFeedbackPortal/server
node server.js
```

## Final Verification

1. Access the S3 static website URL in your browser
2. Test login functionality with sample credentials
3. Test feedback submission
4. Verify CSV export feature uploads files to S3 bucket

## Troubleshooting

### Common Issues

- **API calls failing:** Verify security groups allow traffic on required ports
- **Database connection issues:** Check RDS security group allows MySQL access from EC2 security group
- **Frontend not loading:** Ensure S3 bucket policy allows public read access
- **EC2 not accessible:** Verify public subnet configuration and Internet Gateway routing

### Key Checkpoints

- ✅ EC2 instance has public IP and is in public subnet
- ✅ RDS instance is in private subnet without public access
- ✅ Security groups properly configured
- ✅ Route tables and Network ACLs allow required traffic
- ✅ Backend server is running on EC2
- ✅ Frontend is accessible via S3 static website hosting

## Expected Output

After successful deployment:

- **Apache server** running at `http://<EC2-public-IP>/`
- **Frontend application** hosted on S3 with working login functionality
- **Backend API** on EC2 handling authentication and data operations
- **Database** storing user data and feedback submissions
- **CSV exports** automatically uploaded to configured S3 bucket
- **Complete multi-tier architecture** demonstrating AWS service integration

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL (AWS RDS)
- **Cloud Services:** AWS EC2, RDS, S3, VPC
- **Web Server:** Apache HTTP Server

## Learning Outcomes

This project demonstrates:
- AWS VPC configuration and network security
- Multi-tier application architecture on AWS
- Integration between AWS services (EC2, RDS, S3)
- Database design and management
- RESTful API development
- Static website hosting on S3
- Cloud security best practices

---

**Disclaimer:** This project was developed for educational purposes to demonstrate AWS cloud hosting concepts. Please evaluate based on architectural implementation rather than feature completeness.