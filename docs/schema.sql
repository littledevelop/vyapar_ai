
-- VyaparAI PRO - Production Database Schema
-- For Laravel + MySQL 8.0

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  business_name VARCHAR(255),
  preferred_lang ENUM('EN','HI','GU') DEFAULT 'EN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bills (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  bill_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  category ENUM('Sales','Purchase','Kharch') NOT NULL,
  confidence INT DEFAULT 95,
  image_path VARCHAR(500),
  extracted_data JSON NOT NULL COMMENT 'Stores {items[], shopName, date, amount, category, confidence}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, bill_date),
  INDEX idx_category (category)
);