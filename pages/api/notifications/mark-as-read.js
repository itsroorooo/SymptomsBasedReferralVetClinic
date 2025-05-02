 export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    const userId = req.session.user.id;
  
    try {
      await pool.query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error marking notifications as read' });
    }
  }