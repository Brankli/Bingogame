-- Add role column to users table
ALTER TABLE users 
ADD COLUMN role ENUM('admin', 'user') NOT NULL DEFAULT 'user';

-- Create room_managers table
CREATE TABLE IF NOT EXISTS room_managers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  roomId INT NOT NULL,
  assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_room (userId, roomId)
);

-- Make the first user an admin (optional - adjust as needed)
UPDATE users SET role = 'admin' WHERE id = 1 LIMIT 1;
